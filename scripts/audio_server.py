"""
Minimal local audio generation server for RnR Vibe.

Wraps Meta's MusicGen (music) and AudioGen (sound effects) behind a small
FastAPI HTTP service so the Next.js side can call it the same way it calls
Stable Diffusion.

Endpoints
---------
GET  /health        -> {"ready": bool, "loaded": {...}}
POST /music         -> WAV bytes.   body: {prompt, duration, model}
POST /sfx           -> WAV bytes.   body: {prompt, duration}

Install
-------
    pip install -r scripts/requirements-audio.txt

Run
---
    python scripts/audio_server.py
    # defaults to 127.0.0.1:7870, override with AUDIO_HOST / AUDIO_PORT

Notes
-----
- First call per model downloads weights from Hugging Face (~2-4 GB each).
- MusicGen small ~300M params (~2 GB VRAM). Medium ~1.5B (~8 GB VRAM).
- AudioGen medium ~1.5B (~8 GB VRAM). CPU works but is slow.
"""

from __future__ import annotations

import gc
import io
import os
import sys
from typing import Dict, Optional

import torch
import torchaudio
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

try:
    from audiocraft.models import AudioGen, MusicGen
except ImportError as e:
    sys.stderr.write(
        "audiocraft is not installed. Run: pip install -r scripts/requirements-audio.txt\n"
    )
    raise

HOST = os.getenv("AUDIO_HOST", "127.0.0.1")
PORT = int(os.getenv("AUDIO_PORT", "7870"))
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Transparently retry a failed GPU run on CPU. Slow (tens of seconds to
# minutes per clip) but saves the request when SD or Ollama are contending
# for VRAM. Set AUDIO_CPU_FALLBACK=0 to disable.
CPU_FALLBACK = os.getenv("AUDIO_CPU_FALLBACK", "1") == "1"

MUSIC_MAX_SECONDS = 30
SFX_MAX_SECONDS = 10
DEFAULT_MUSIC_MODEL = os.getenv("MUSICGEN_MODEL", "facebook/musicgen-small")
DEFAULT_SFX_MODEL = os.getenv("AUDIOGEN_MODEL", "facebook/audiogen-medium")

app = FastAPI(title="RnR Vibe Audio Server", version="1.0.0")

_music_cache: Dict[str, MusicGen] = {}
_sfx_cache: Dict[str, AudioGen] = {}


def _get_music(model_id: str) -> MusicGen:
    if model_id not in _music_cache:
        sys.stderr.write(f"[audio] Loading MusicGen model: {model_id} on {DEVICE}\n")
        m = MusicGen.get_pretrained(model_id, device=DEVICE)
        _music_cache[model_id] = m
    return _music_cache[model_id]


def _get_sfx(model_id: str) -> AudioGen:
    if model_id not in _sfx_cache:
        sys.stderr.write(f"[audio] Loading AudioGen model: {model_id} on {DEVICE}\n")
        m = AudioGen.get_pretrained(model_id, device=DEVICE)
        _sfx_cache[model_id] = m
    return _sfx_cache[model_id]


def _encode_wav(tensor: torch.Tensor, sample_rate: int) -> bytes:
    buffer = io.BytesIO()
    # torchaudio expects (channels, samples) 2D tensor
    if tensor.dim() == 3:
        tensor = tensor.squeeze(0)
    if tensor.dim() == 1:
        tensor = tensor.unsqueeze(0)
    torchaudio.save(buffer, tensor.cpu(), sample_rate, format="wav")
    return buffer.getvalue()


def _is_oom(err: BaseException) -> bool:
    oom_cls = getattr(torch.cuda, "OutOfMemoryError", None)
    if oom_cls is not None and isinstance(err, oom_cls):
        return True
    return "out of memory" in str(err).lower()


def _is_cuda_error(err: BaseException) -> bool:
    return "cuda" in str(err).lower()


def _free_vram() -> None:
    gc.collect()
    if torch.cuda.is_available():
        try:
            torch.cuda.empty_cache()
        except Exception:
            # If the context is already broken, empty_cache itself may throw —
            # swallow so error handling can continue with a clear message.
            pass


class MusicRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500)
    duration: float = Field(10.0, ge=1.0, le=MUSIC_MAX_SECONDS)
    model: Optional[str] = Field(default=None, description="facebook/musicgen-small|medium|large")


class SfxRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500)
    duration: float = Field(5.0, ge=1.0, le=SFX_MAX_SECONDS)


@app.post("/reset")
def reset():
    """Drop cached models and free VRAM without restarting the process.

    Useful when the CUDA context is poisoned — calling this is cheaper than
    killing and relaunching the server, and lets the next request reload
    weights cleanly.
    """
    cleared = {
        "music": list(_music_cache.keys()),
        "sfx": list(_sfx_cache.keys()),
    }
    _music_cache.clear()
    _sfx_cache.clear()
    _free_vram()
    sys.stderr.write(f"[audio] Caches cleared: {cleared}\n")
    return {"ok": True, "cleared": cleared, "device": DEVICE}


@app.get("/health")
def health():
    return {
        "ready": True,
        "device": DEVICE,
        "cpu_fallback": CPU_FALLBACK,
        "loaded": {
            "music": list(_music_cache.keys()),
            "sfx": list(_sfx_cache.keys()),
        },
        "defaults": {
            "music": DEFAULT_MUSIC_MODEL,
            "sfx": DEFAULT_SFX_MODEL,
        },
        "limits": {
            "music_max_seconds": MUSIC_MAX_SECONDS,
            "sfx_max_seconds": SFX_MAX_SECONDS,
        },
    }


@app.post("/music")
def music(req: MusicRequest):
    model_id = req.model or DEFAULT_MUSIC_MODEL
    _free_vram()
    try:
        model = _get_music(model_id)
    except Exception as e:
        raise HTTPException(502, f"Failed to load MusicGen model '{model_id}': {e}")

    model.set_generation_params(duration=req.duration)
    try:
        with torch.no_grad():
            wav = model.generate([req.prompt], progress=False)
    except Exception as e:
        # The CUDA context is likely poisoned — evict the cached model so the
        # next request reloads cleanly instead of hitting the same bad state.
        _music_cache.pop(model_id, None)
        _free_vram()
        if _is_oom(e):
            raise HTTPException(
                503,
                "GPU out of memory. Close Stable Diffusion / Ollama or pick a smaller MusicGen model.",
            )
        if _is_cuda_error(e):
            if CPU_FALLBACK:
                sys.stderr.write(f"[audio] CUDA failed, retrying MusicGen on CPU: {e}\n")
                try:
                    cpu_model = MusicGen.get_pretrained(model_id, device="cpu")
                    cpu_model.set_generation_params(duration=req.duration)
                    with torch.no_grad():
                        wav = cpu_model.generate([req.prompt], progress=False)
                    data = _encode_wav(wav[0], cpu_model.sample_rate)
                    return Response(content=data, media_type="audio/wav")
                except Exception as cpu_err:
                    raise HTTPException(
                        500, f"MusicGen failed on both GPU and CPU: {cpu_err}"
                    )
            raise HTTPException(
                502,
                f"GPU state corrupted — restart audio_server.py (or set AUDIO_CPU_FALLBACK=1). ({e})",
            )
        raise HTTPException(500, f"MusicGen failed: {e}")

    data = _encode_wav(wav[0], model.sample_rate)
    return Response(content=data, media_type="audio/wav")


@app.post("/sfx")
def sfx(req: SfxRequest):
    model_id = DEFAULT_SFX_MODEL
    _free_vram()
    try:
        model = _get_sfx(model_id)
    except Exception as e:
        raise HTTPException(502, f"Failed to load AudioGen model: {e}")

    model.set_generation_params(duration=req.duration)
    try:
        with torch.no_grad():
            wav = model.generate([req.prompt], progress=False)
    except Exception as e:
        _sfx_cache.pop(model_id, None)
        _free_vram()
        if _is_oom(e):
            raise HTTPException(
                503,
                "GPU out of memory. Close Stable Diffusion / Ollama or lower the duration.",
            )
        if _is_cuda_error(e):
            if CPU_FALLBACK:
                sys.stderr.write(f"[audio] CUDA failed, retrying AudioGen on CPU: {e}\n")
                try:
                    cpu_model = AudioGen.get_pretrained(model_id, device="cpu")
                    cpu_model.set_generation_params(duration=req.duration)
                    with torch.no_grad():
                        wav = cpu_model.generate([req.prompt], progress=False)
                    data = _encode_wav(wav[0], cpu_model.sample_rate)
                    return Response(content=data, media_type="audio/wav")
                except Exception as cpu_err:
                    raise HTTPException(
                        500, f"AudioGen failed on both GPU and CPU: {cpu_err}"
                    )
            raise HTTPException(
                502,
                f"GPU state corrupted — restart audio_server.py (or set AUDIO_CPU_FALLBACK=1). ({e})",
            )
        raise HTTPException(500, f"AudioGen failed: {e}")

    data = _encode_wav(wav[0], model.sample_rate)
    return Response(content=data, media_type="audio/wav")


if __name__ == "__main__":
    import uvicorn

    sys.stderr.write(
        f"[audio] Starting on http://{HOST}:{PORT} (device={DEVICE}, cpu_fallback={CPU_FALLBACK})\n"
    )
    sys.stderr.write(f"[audio] Music default: {DEFAULT_MUSIC_MODEL}\n")
    sys.stderr.write(f"[audio] SFX default:   {DEFAULT_SFX_MODEL}\n")
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
