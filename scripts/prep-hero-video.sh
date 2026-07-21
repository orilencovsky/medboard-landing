#!/usr/bin/env bash
# Compress a raw AI-generated clip into hero.{mp4,webm} (desktop) and
# hero-mobile.{mp4,webm} (phones, <=600px) at the repo root.
# The landing page (index.html + he/index.html) picks between them via
# <source media="(max-width: 600px)">, webm before mp4 in each tier.
# Usage: ./scripts/prep-hero-video.sh path/to/raw-clip.mp4
set -euo pipefail

command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg missing — run: brew install ffmpeg"; exit 1; }

RAW="${1:?usage: prep-hero-video.sh <raw-clip.mp4>}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"

# -an strips audio, faststart = instant playback start.
# 1600px covers desktop under the dark overlay; 800px is plenty for a
# phone viewport (~2x DPR at 375-430 CSS px) and the abstract, low-detail
# footage compresses so well at that size that quality can stay high
# while the file stays tiny (a few hundred KB, not the desktop file's MBs).
ffmpeg -y -i "$RAW" -an -vf "scale=1600:-2" -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart "$DIR/hero.mp4"
ffmpeg -y -i "$RAW" -an -vf "scale=1600:-2" -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 "$DIR/hero.webm"
ffmpeg -y -i "$RAW" -an -vf "scale=800:-2" -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart "$DIR/hero-mobile.mp4"
ffmpeg -y -i "$RAW" -an -vf "scale=800:-2" -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 "$DIR/hero-mobile.webm"

echo "--- output sizes (target: desktop pair under ~5 MB, mobile pair under ~1 MB) ---"
ls -lh "$DIR"/hero.mp4 "$DIR"/hero.webm "$DIR"/hero-mobile.mp4 "$DIR"/hero-mobile.webm
