# Local services

## Audio server (MusicGen + AudioGen)

Small FastAPI wrapper around Meta's `audiocraft` models. Exposes `/music` and
`/sfx` HTTP endpoints so the Next.js side can generate audio the same way it
calls Stable Diffusion.

### One-time setup

```bash
# 1. Install PyTorch for your hardware (see https://pytorch.org for the right command).
#    Example for CUDA 12.1:
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121

# 2. Install audiocraft + API deps:
pip install -r scripts/requirements-audio.txt
```

First `/music` or `/sfx` call downloads the model weights from Hugging Face
(~2–4 GB each, cached to `~/.cache/huggingface/`). Subsequent calls are fast.

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
