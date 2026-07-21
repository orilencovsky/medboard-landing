#!/usr/bin/env bash
# Compress a raw AI-generated clip into hero.mp4 + hero.webm at the repo root.
# The landing page (index.html + he/index.html) loads /hero.webm then /hero.mp4.
# Usage: ./scripts/prep-hero-video.sh path/to/raw-clip.mp4
set -euo pipefail

command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg missing — run: brew install ffmpeg"; exit 1; }

RAW="${1:?usage: prep-hero-video.sh <raw-clip.mp4>}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"

# -an strips audio, 1600px wide is plenty under the dark overlay, faststart = instant playback start
ffmpeg -y -i "$RAW" -an -vf "scale=1600:-2" -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart "$DIR/hero.mp4"
ffmpeg -y -i "$RAW" -an -vf "scale=1600:-2" -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 "$DIR/hero.webm"

echo "--- output sizes (target: each under ~5 MB) ---"
ls -lh "$DIR"/hero.mp4 "$DIR"/hero.webm
