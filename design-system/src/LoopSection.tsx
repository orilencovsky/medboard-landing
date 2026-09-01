import * as React from 'react';
import { SectionHeading } from './SectionHeading';

export type LoopNodeState = 'live' | 'soon';

/** Which accent scale a node draws on. Follows the library's ownership split:
 *  cyan for the learner's own data, violet for the system acting (AI-tutor surfaces). */
export type LoopAccent = 'cyan' | 'violet';

export interface LoopNode {
  /** Two-digit ordinal shown inside the ring node, e.g. "01". */
  no: string;
  /** Short label under the node, e.g. "Questions". */
  name: string;
  /** @default 'live' — 'soon' renders the rail's upcoming-node treatment plus a roadmap pill. */
  state?: LoopNodeState;
  /** @default 'cyan' */
  accent?: LoopAccent;
  /** Mono eyebrow shown in the detail panel, e.g. "STEP 01 · LIVE". */
  step: string;
  title: string;
  lead: string;
  points: string[];
}

export type LoopHeatTone = 'risk' | 'warn' | 'ok';

export interface LoopSectionProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Exactly four nodes, in flow order starting at the top of the ring. */
  nodes: LoopNode[];
  /** Mono label above the readiness figure, e.g. "READINESS". */
  readinessLabel: string;
  /** The figure itself, e.g. "64%". */
  readinessValue: string;
  readinessCaption: string;
  /** Twelve cells for the micro heat map at the centre of the ring. */
  heat: LoopHeatTone[];
  /** Mono label above the "what this looks like without one loop" strip. */
  contrastLabel: string;
  contrastTabs: string[];
  contrastNote: string;
  /** Pill copy for a live node's detail panel, e.g. "Live now". */
  liveLabel: string;
  /** Pill copy for a roadmap node, e.g. "Coming soon". */
  soonLabel: string;
  /** @default 'ltr' — 'rtl' also reverses the ring's flow direction. */
  dir?: 'rtl' | 'ltr';
  /** Index of the node open on first render. @default 0 */
  defaultNode?: number;
}

const W = 520;
const H = 480;
const CX = 260;
const CY = 215;
const R = 175;

/** Ring points, in flow order from the top, for each writing direction. */
const POINTS: Record<'rtl' | 'ltr', Array<{ x: number; y: number }>> = {
  rtl: [
    { x: CX, y: CY - R },
    { x: CX - R, y: CY },
    { x: CX, y: CY + R },
    { x: CX + R, y: CY },
  ],
  ltr: [
    { x: CX, y: CY - R },
    { x: CX + R, y: CY },
    { x: CX, y: CY + R },
    { x: CX - R, y: CY },
  ],
};

/** Sweep flag for the leading half of the ring — 0 sweeps anticlockwise on screen. */
const SWEEP: Record<'rtl' | 'ltr', number> = { rtl: 0, ltr: 1 };

/** Arrowheads sit at the 45° midpoints between nodes; the LTR set mirrors about the centre. */
const ARROWS: Record<'rtl' | 'ltr', Array<{ x: number; y: number; a: number; lead: boolean }>> = {
  rtl: [
    { x: 136.3, y: 91.3, a: 135, lead: true },
    { x: 136.3, y: 338.7, a: 45, lead: true },
    { x: 383.7, y: 338.7, a: -45, lead: false },
    { x: 383.7, y: 91.3, a: -135, lead: false },
  ],
  ltr: [
    { x: 383.7, y: 91.3, a: 45, lead: true },
    { x: 383.7, y: 338.7, a: 135, lead: true },
    { x: 136.3, y: 338.7, a: -135, lead: false },
    { x: 136.3, y: 91.3, a: -45, lead: false },
  ],
};

const HEAT: Record<LoopHeatTone, string> = {
  risk: 'var(--ds-danger)',
  warn: 'var(--ds-warning)',
  ok: 'var(--ds-teal)',
};

/** Rail track navy — no token covers it; matches the Features stage rail. */
const TRACK = '#14395C';

function accentColor(accent: LoopAccent) {
  return accent === 'violet' ? 'var(--ds-violet-light)' : 'var(--ds-cyan)';
}

function accentFill(accent: LoopAccent) {
  return accent === 'violet' ? 'var(--ds-gradient-action)' : 'var(--ds-gradient-cta)';
}

function accentSoft(accent: LoopAccent) {
  return accent === 'violet' ? 'var(--ds-violet-pale)' : 'var(--ds-cyan-soft)';
}

function accentWash(accent: LoopAccent, alpha: number) {
  return accent === 'violet' ? `rgba(124,92,255,${alpha})` : `rgba(34,211,238,${alpha})`;
}

/**
 * Dark full-width section that tells the product as a closed loop rather than a feature list:
 * four ring nodes feeding a model of the learner at the centre, with roadmap stages carried
 * in the stage rail's own upcoming-node treatment instead of a separate visual language.
 */
export function LoopSection({
  eyebrow,
  title,
  subtitle,
  nodes,
  readinessLabel,
  readinessValue,
  readinessCaption,
  heat,
  contrastLabel,
  contrastTabs,
  contrastNote,
  liveLabel,
  soonLabel,
  dir = 'ltr',
  defaultNode = 0,
}: LoopSectionProps) {
  const [picked, setPicked] = React.useState(defaultNode);
  const points = POINTS[dir];
  const arrows = ARROWS[dir];
  const sweep = SWEEP[dir];
  const active = nodes[picked] ?? nodes[0];
  const activeSoon = (active?.state ?? 'live') === 'soon';
  const activeAccent = active?.accent ?? 'cyan';

  const lead = points[0];
  const tail = points[2];
  const leadArc = `M ${lead.x} ${lead.y} A ${R} ${R} 0 0 ${sweep} ${tail.x} ${tail.y}`;
  const restArc = `M ${tail.x} ${tail.y} A ${R} ${R} 0 0 ${sweep} ${lead.x} ${lead.y}`;

  return (
    <section dir={dir} style={{ background: 'var(--ds-gradient-vision-bg)', padding: '96px 32px', position: 'relative', overflow: 'hidden' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.45,
          background:
            'repeating-linear-gradient(90deg, rgba(56,189,248,.14) 0 1px, transparent 1px 72px), repeating-linear-gradient(180deg, rgba(56,189,248,.14) 0 1px, transparent 1px 72px), repeating-linear-gradient(90deg, rgba(56,189,248,.06) 0 1px, transparent 1px 18px), repeating-linear-gradient(180deg, rgba(56,189,248,.06) 0 1px, transparent 1px 18px)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(120% 90% at 50% 0%, rgba(6,18,37,.25), rgba(6,18,37,.55) 60%, rgba(6,18,37,.72) 100%)',
        }}
      />

      <div style={{ position: 'relative', maxWidth: 1160, margin: '0 auto' }}>
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} theme="dark" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 40, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: W, height: H, margin: '0 auto' }}>
            <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', inset: 0 }} aria-hidden>
              <circle cx={CX} cy={CY} r={R} fill="none" stroke={TRACK} strokeWidth={2} />
              <path d={leadArc} fill="none" stroke="var(--ds-cyan)" strokeWidth={2.5} />
              <path d={restArc} fill="none" stroke="var(--ds-navy-border)" strokeWidth={2} strokeDasharray="6 9" />
              {arrows.map((a, i) => (
                <path
                  key={i}
                  d="M -6 -7 L 8 0 L -6 7 Z"
                  fill={a.lead ? 'var(--ds-cyan)' : 'var(--ds-navy-border)'}
                  transform={`translate(${a.x} ${a.y}) rotate(${a.a})`}
                />
              ))}
            </svg>

            <div
              style={{
                position: 'absolute',
                left: CX,
                top: CY,
                transform: 'translate(-50%, -50%)',
                width: 186,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 9,
                padding: '18px 14px',
                borderRadius: 'var(--ds-radius-lg)',
                border: '1px solid var(--ds-navy-border)',
                background: 'rgba(8,29,58,.92)',
                boxShadow: '0 20px 50px rgba(2,8,20,.55)',
              }}
            >
              <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--ds-text-onDark-faint)', direction: 'ltr' }}>
                {readinessLabel}
              </span>
              <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 34, fontWeight: 500, color: 'var(--ds-cyan)', lineHeight: 1, direction: 'ltr' }}>
                {readinessValue}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 4, width: '100%' }}>
                {heat.map((tone, i) => (
                  <span key={i} style={{ height: 12, borderRadius: 3, background: HEAT[tone], opacity: 0.34 + ((i * 7) % 5) * 0.06 }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--ds-text-onDark-muted)', textAlign: 'center' }}>{readinessCaption}</span>
            </div>

            {nodes.slice(0, 4).map((n, i) => {
              const on = i === picked;
              const soon = (n.state ?? 'live') === 'soon';
              const accent = n.accent ?? 'cyan';
              const p = points[i] ?? points[0];
              return (
                <button
                  key={n.no}
                  type="button"
                  onClick={() => setPicked(i)}
                  aria-pressed={on}
                  style={{
                    position: 'absolute',
                    left: p.x,
                    top: p.y,
                    transform: 'translate(-50%, -22px)',
                    width: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    padding: 0,
                    background: 'transparent',
                    border: 'none',
                    font: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--ds-font-mono)',
                      fontSize: 16,
                      fontWeight: 500,
                      direction: 'ltr',
                      transition: 'all .25s',
                      border: `1px solid ${soon ? (on ? 'var(--ds-text-onDark-muted)' : 'var(--ds-navy-border)') : accentColor(accent)}`,
                      background: soon ? 'rgba(8,29,58,.9)' : on ? accentFill(accent) : accentWash(accent, 0.12),
                      color: soon
                        ? on
                          ? 'var(--ds-text-onDark-secondary)'
                          : 'var(--ds-text-onDark-faint)'
                        : on
                          ? '#062033'
                          : accentSoft(accent),
                      boxShadow: on ? `0 0 0 5px ${soon ? 'rgba(125,162,196,.14)' : accentWash(accent, 0.16)}` : 'none',
                    }}
                  >
                    {n.no}
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      textAlign: 'center',
                      transition: 'color .25s',
                      color: soon ? (on ? 'var(--ds-text-onDark-secondary)' : 'var(--ds-text-onDark-faint)') : on ? 'var(--ds-text-onDark-primary)' : 'var(--ds-text-onDark-secondary)',
                    }}
                  >
                    {n.name}
                  </span>
                  {soon && (
                    <span
                      style={{
                        fontFamily: 'var(--ds-font-mono)',
                        fontSize: 10,
                        letterSpacing: '.16em',
                        color: 'var(--ds-text-onDark-faint)',
                        border: '1px solid var(--ds-navy-border)',
                        borderRadius: 'var(--ds-radius-pill)',
                        padding: '4px 11px',
                      }}
                    >
                      {soonLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            style={{
              background: 'var(--ds-navy-card)',
              border: `1px solid ${activeSoon ? 'var(--ds-navy-border)' : accentWash(activeAccent, 0.5)}`,
              borderRadius: 'var(--ds-radius-xl)',
              padding: 28,
              boxShadow: '0 30px 80px rgba(2,8,20,.6)',
              minHeight: 424,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              transition: 'border-color .25s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontFamily: 'var(--ds-font-mono)',
                  fontSize: 11,
                  letterSpacing: '.18em',
                  direction: 'ltr',
                  color: activeSoon ? 'var(--ds-text-onDark-muted)' : accentColor(activeAccent),
                }}
              >
                {active?.step}
              </span>
              <span style={{ flexGrow: 1, height: 1, background: 'var(--ds-navy-line)' }} />
              <span
                style={{
                  fontFamily: 'var(--ds-font-mono)',
                  fontSize: 10,
                  letterSpacing: '.16em',
                  borderRadius: 'var(--ds-radius-pill)',
                  padding: '5px 12px',
                  color: activeSoon ? 'var(--ds-text-onDark-faint)' : 'var(--ds-teal)',
                  border: `1px solid ${activeSoon ? 'var(--ds-navy-border)' : 'rgba(94,234,212,.4)'}`,
                }}
              >
                {activeSoon ? soonLabel : liveLabel}
              </span>
            </div>

            <h3 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: 'var(--ds-text-onDark-primary)', lineHeight: 1.3 }}>{active?.title}</h3>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.75, color: 'var(--ds-text-onDark-secondary)' }}>{active?.lead}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(active?.points ?? []).map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 2,
                      marginTop: 8,
                      flexShrink: 0,
                      background: activeSoon ? 'var(--ds-text-onDark-muted)' : accentColor(activeAccent),
                    }}
                  />
                  <span style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ds-text-onDark-nav)' }}>{t}</span>
                </div>
              ))}
            </div>

            <div style={{ flexGrow: 1 }} />

            <div style={{ borderTop: '1px solid var(--ds-navy-line)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--ds-text-onDark-faint)', direction: 'ltr' }}>
                {contrastLabel}
              </span>
              <div style={{ display: 'flex', gap: 6, opacity: 0.5 }}>
                {contrastTabs.map((t) => (
                  <span
                    key={t}
                    style={{
                      flexGrow: 1,
                      height: 26,
                      borderRadius: '6px 6px 0 0',
                      border: '1px solid var(--ds-navy-border)',
                      borderBottom: 'none',
                      background: 'var(--ds-navy-tint)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--ds-font-mono)',
                      fontSize: 9,
                      letterSpacing: '.06em',
                      color: 'var(--ds-text-onDark-faint)',
                      overflow: 'hidden',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ds-text-onDark-muted)' }}>{contrastNote}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
