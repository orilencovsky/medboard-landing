#!/usr/bin/env bash
# Compress a raw AI-generated clip into hero.{mp4,webm} (desktop) and
# hero-mobile.{mp4,webm} (phones, <=600px) at the repo root.
# The landing page (index.html + he/index.html) picks between them via
# <source media="(max-width: 600px) and (orientation: portrait)">, webm before mp4 in each tier.
# Usage: ./scripts/prep-hero-video.sh path/to/raw-clip.mp4
set -euo pipefail

command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg missing — run: brew install ffmpeg"; exit 1; }

RAW="${1:?usage: prep-hero-video.sh <raw-clip.mp4>}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Phones: the page serves hero-mobile only to portrait viewports <=600px, where the hero is taller
# than wide and object-fit: cover shows a narrow centre strip. So the mobile clip is a centre 9:16
# crop of the master (crop=ih*9/16:ih, centred), scaled to 540x960 at 24 fps. The old landscape
# 800x450 clip was upscaled ~2x to that strip and looked soft. Assumes a 16:9 master. Keep the
# frame count and duration identical to the desktop clip: the crossfade loop relies on it.
MOBILE_VF="crop=ih*9/16:ih,scale=540:960:flags=lanczos,fps=24,format=yuv420p"

# -an strips audio, faststart = instant playback start.
# 1600px covers desktop under the dark overlay; the mobile strip above is plenty for a phone
# viewport and the abstract, low-detail footage compresses so well that quality can stay high
# while the file stays small (a few hundred KB, not the desktop file's MBs).
# The desktop mp4 is capped at 1200 kbps: without the cap it came out at ~6 Mbps
# (4.5 MB), 15x the webm, for footage that sits under a dark overlay anyway.
ffmpeg -y -i "$RAW" -an -vf "scale=1600:-2" -c:v libx264 -crf 28 -maxrate 1200k -bufsize 2400k -preset slow -pix_fmt yuv420p -movflags +faststart "$DIR/hero.mp4"
ffmpeg -y -i "$RAW" -an -vf "scale=1600:-2" -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 "$DIR/hero.webm"
ffmpeg -y -i "$RAW" -an -vf "$MOBILE_VF" -c:v libx264 -profile:v main -crf 22 -preset veryslow -movflags +faststart "$DIR/hero-mobile.mp4"
ffmpeg -y -i "$RAW" -an -vf "$MOBILE_VF" -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -cpu-used 1 "$DIR/hero-mobile.webm"

echo "--- output sizes (target: desktop pair under ~5 MB, mobile pair under ~1 MB) ---"
ls -lh "$DIR"/hero.mp4 "$DIR"/hero.webm "$DIR"/hero-mobile.mp4 "$DIR"/hero-mobile.webm
