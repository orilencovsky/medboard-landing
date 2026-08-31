# MeduXa Landing DS — conventions

This is the component library behind the **MeduXa.ai marketing site** (not the app product — see the separate "MeduXa Design System" project for that). It ships 14 components covering the whole landing page: nav, hero, content sections, and cards.

## Setup

No provider or wrapper is required — components are plain, self-contained functions. Just import from `meduxa-landing-ds` and use directly:

```jsx
import { Hero, Navbar, FeatureCard } from 'meduxa-landing-ds';
```

**Dark-surface components must be composed on a dark background.** `Button` (`variant="secondary"`), `Badge`, `StatItem`, and `Logo`'s default wordmark color are styled for the brand's navy surfaces (`--ds-ink` / `--ds-deep`) — placing them directly on white renders illegibly light text. `Navbar`, `Hero`, `VisionSection`, and `Footer` already carry their own dark background and don't need wrapping.

Fonts (IBM Plex Sans + IBM Plex Mono) load via a Google Fonts `@import` shipped in the bundled stylesheet — no local font files to configure.

## Styling idiom: CSS custom properties, not utility classes

This DS has no class-name system (no Tailwind-style utilities). Every color, gradient, radius, and font is a CSS custom property defined in the shipped stylesheet and consumed via `var(--token-name)` in inline styles. Use the real tokens — don't invent new hex values or class names:

| Category | Tokens |
|---|---|
| Ink/navy scale | `--ds-ink`, `--ds-deep`, `--ds-navy2`, `--ds-navy-card`, `--ds-navy-border`, `--ds-footer-ink` |
| Accent — cyan | `--ds-cyan`, `--ds-cyan-soft`, `--ds-cyan-pale`, `--ds-sky`, `--ds-sky-light`, `--ds-teal` |
| Accent — violet | `--ds-violet-deep`, `--ds-violet`, `--ds-violet-light`, `--ds-violet-pale`, `--ds-violet-tint`, `--ds-violet-tint-border` |
| Reserved semantics | `--ds-warning` (amber, warnings only), `--ds-danger` (errors only) |
| Text on dark | `--ds-text-onDark-primary/secondary/muted/faint` |
| Text on light | `--ds-text-heading`, `--ds-text-body`, `--ds-text-faint`, `--ds-text-cyan-accent` |
| Surfaces | `--ds-bg-app`, `--ds-bg-white`, `--ds-border-light`, `--ds-border-input` |
| Gradients | `--ds-gradient-hero-bg`, `--ds-gradient-vision-bg`, `--ds-gradient-cta`, `--ds-gradient-heading-accent`, `--ds-gradient-action`, `--ds-gradient-action-hover` |
| Type | `--ds-font-sans` (IBM Plex Sans), `--ds-font-mono` (IBM Plex Mono) |
| Radii | `--ds-radius-sm/md/lg/xl/pill` |

**Two accent scales, split by ownership.** This is the rule to follow, not just the hex values:

| Scale | Owns |
|---|---|
| **Cyan / sky** (`--ds-gradient-cta`) | The learner's own data — progress bars, mastery %, scores, streaks, stat numbers, feature-card dots, step-number chips |
| **Indigo violet** (`--ds-gradient-action`) | The system acting — commit actions, sign-up and early access, AI-tutor surfaces, selected state, focus rings |
| `--ds-warning` (amber) | Warnings only. Never a CTA. |
| `--ds-danger` (red) | Wrong answers and errors only. |

The two accents never appear on the same control. The logo is unchanged — cyan mark, cyan `.ai` suffix.

`Button` carries this split: `variant="action"` is the violet commit button (nav CTA, hero CTA, waitlist submit), `variant="primary"` stays cyan for in-product actions that aren't a commit, and `variant="secondary"` is the navy outline that pairs beside either. Reach for an existing variant before inventing a new accent treatment.

Two plain CSS classes exist for hover states inline styles can't express: `.ds-nav-link` and `.ds-m-link` (desktop/mobile nav link hover-to-cyan). There's no broader class vocabulary beyond these two — everything else is inline `style` objects reading tokens.

## Where the truth lives

- `_ds/styles.css` (and its `_ds_bundle.css` import) — every token listed above, plus the two link classes and the hero-mark draw-in keyframes.
- Each component's own `.d.ts` — full prop shapes (all copy, links, and data are props; nothing is hardcoded except the ones-repeated brand marks like the logo SVG).

## Composing a section

Section components (`Hero`, `VisionSection`, `Navbar`, `Footer`) take structured props for their content — arrays of links, stat pairs, pill labels — rather than children. Card components (`FeatureCard`, `PrincipleCard`, `StepCard`) are meant to be mapped over a data array and dropped into a CSS grid, exactly like the source page does:

```jsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
  {features.map((f) => (
    <FeatureCard key={f.title} title={f.title} description={f.description} />
  ))}
</div>
```
