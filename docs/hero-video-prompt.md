# Hero background video — generation prompt

Paste this into Sora (ChatGPT), Veo (Gemini), or Runway. Aim for a 8–10 s, 16:9, 1080p clip.

## Prompt

> Abstract medical-science background animation, seamless loop. Slow-flowing translucent
> waves of deep navy blue and dark teal. A thin luminous cyan ECG heartbeat line pulses
> gently across the frame, and delicate glowing molecular structures drift like
> constellations. Soft particles float slowly, subtle depth of field. Dark, cinematic,
> elegant, minimal. Very slow camera drift. No text, no people, no logos, no lens flares.
> Deep navy background (#061225 to #0C2A4E).

Alternative middle sentences (swap the ECG sentence):

- DNA: "A faint DNA double helix rotates very slowly in soft focus, strands glowing cyan and sky-blue."
- Pure abstract: "Luminous cyan and sky-blue light ribbons flow diagonally like silk in water."
- Logo motif (echoes the MeduXa mark — two crossing curves + node): "Two elegant luminous curved
  light trails, one cyan and one sky-blue, sweep diagonally and cross at the center of the frame,
  a soft glowing point of light at their intersection."

Never ask the model to render the actual logo — it will distort it. Echo the shape only.

Negative / avoid (if the tool supports it): text, watermark, people, faces, hospital rooms, bright white light, fast motion, flicker.

## Notes

- Motion must be SLOW — the clip loops behind the hero text with a dark tint on top; fast motion distracts.
- "Seamless loop" matters. If the loop pops, generate a longer clip; the cut is barely visible under the overlay.
- Dark output is correct — the page adds its own dark gradient overlay (~85% opacity), only highlights show through.

## After generating

1. Save the raw clip anywhere (e.g. `~/Downloads/hero-raw.mp4`).
2. Run `./scripts/prep-hero-video.sh ~/Downloads/hero-raw.mp4` (needs `brew install ffmpeg` once).
3. It writes `hero.mp4` + `hero.webm` (desktop) and `hero-mobile.mp4` + `hero-mobile.webm` (phones, ≤600px) at the repo root — the pages already reference all four via `<source media>`.
4. Commit + push to deploy.
