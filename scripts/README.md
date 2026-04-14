# Local services

## Audio server (MusicGen + AudioGen)

Small FastAPI wrapper around Meta's `audiocraft` models. Exposes `/music` and
`/sfx` HTTP endpoints so the Next.js side can generate audio the same way it
calls Stable Diffusion.

### One-time setup

```bash
# 1. Install PyTorch for your hardware (see https://pytorch.org for the right command).
#    Example for CUDA 12.1 (pinned — audiocraft needs torch 2.x with CUDA):
pip install torch==2.5.1 torchaudio==2.5.1 torchvision==0.20.1 --index-url https://download.pytorch.org/whl/cu121

# 2. Install audiocraft + API deps:
pip install -r scripts/requirements-audio.txt
```

First `/music` or `/sfx` call downloads the model weights from Hugging Face
(~2–4 GB each, cached to `~/.cache/huggingface/`). Subsequent calls are fast.

### Windows install gotchas

`audiocraft 1.3.0` pins dependencies that are painful on Windows + Python 3.10:

- **`av==11.0.0`** has no prebuilt Windows wheel and needs Visual C++ Build Tools
  to compile. Workaround: install a newer prebuilt wheel and then install
  audiocraft with `--no-deps`:
  ```bash
  pip install --only-binary=:all: av            # installs av 17.x wheel
  pip install audiocraft --no-deps
  pip install demucs einops encodec flashy huggingface_hub hydra-core hydra_colorlog \
              julius librosa num2words numpy protobuf sentencepiece spacy \
              torchmetrics tqdm transformers fastapi "uvicorn[standard]"
  ```
- **`xformers<0.0.23`** has no wheel for recent Python/torch combos. audiocraft
  only uses it as an optional attention backend (default is torch's native
  attention), so you can safely make the import optional. Edit
  `<site-packages>/audiocraft/modules/transformer.py`, replace
  `from xformers import ops` with:
  ```python
  try:
      from xformers import ops
  except ImportError:
      ops = None
  ```
  The startup warning about xFormers C++/CUDA extensions is harmless.

### Run

```bash
python scripts/audio_server.py
# -> http://127.0.0.1:7870
```

Override host/port/models with env vars:

| Variable | Default | Purpose |
|---|---|---|
| `AUDIO_HOST` | `127.0.0.1` | bind address |
| `AUDIO_PORT` | `7870` | bind port |
| `MUSICGEN_MODEL` | `facebook/musicgen-small` | `small` / `medium` / `large` |
| `AUDIOGEN_MODEL` | `facebook/audiogen-medium` | AudioGen variant |
| `AUDIO_CPU_FALLBACK` | `1` | Retry on CPU when CUDA errors (OOM, corrupted context). Slow but saves the request. Set to `0` to disable. |

### When CUDA errors ("CUDA error: unknown error") appear

Almost always caused by VRAM contention with Stable Diffusion or Ollama — once
the CUDA context is poisoned, every subsequent request in the same Python
process fails the same way. CPU fallback is on by default (`AUDIO_CPU_FALLBACK=1`)
so the request still completes, just slowly.

To drop cached models and free VRAM without restarting the process:

```bash
curl -X POST http://127.0.0.1:7870/reset
```

If the GPU itself is still unhealthy after that, restart `audio_server.py`.

### Tell the Next.js app where it lives

Add to `.env.local`:

```
AUDIO_URL=http://127.0.0.1:7870
```

### VRAM / RAM requirements (approximate)

| Model                     | VRAM (GPU) | Notes |
|---------------------------|-----------:|-------|
| MusicGen small (default)  | ~2 GB      | Fast, good quality for 10-15 s clips |
| MusicGen medium           | ~8 GB      | Noticeably better quality |
| MusicGen large            | ~16 GB     | Best quality, slow |
| AudioGen medium (default) | ~8 GB      | Sound effects |

CPU-only works but is slow: expect ~30-60 s of wall time per 10 s of audio
on a modern CPU.
