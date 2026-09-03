import * as React from 'react';

export type FeaturesLoopAccent = 'cyan' | 'violet' | 'soon';

export interface FeaturesLoopStep {
  /** Zero-padded step number shown in the ring dot and ribbon pill, e.g. "01" */
  number: string;
  /** Label under the ring dot and used in the panel's aria-label, e.g. "Review & Retain" */
  label: string;
  /** Shorter label for the mobile ribbon pill when `label` won't fit there. @default label */
  shortLabel?: string;
  /** Visual track — CSS decides everything it implies, this only sets the attribute.
   *  'violet' marks the AI-tutor step; 'soon' is unshipped and never takes the
   *  gradient fill, however selected. @default 'cyan' */
  accent?: FeaturesLoopAccent;
  /** Small chip after the ring label, e.g. "Soon" */
  flagLabel?: string;
  /** Text after "Step NN · " in the panel's tag line, e.g. "Live" or "Roadmap" */
  tagStatus: string;
  /** Status pill text in the panel, e.g. "Live now" or "Coming soon" */
  statusLabel: string;
  heading: string;
  lead: string;
  points: string[];
}

export interface FeaturesLoopProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Exactly four — the ring geometry is fixed to four positions. */
  steps: [FeaturesLoopStep, FeaturesLoopStep, FeaturesLoopStep, FeaturesLoopStep];
  /** 0-100, shown in the ring's center card. @default 92 */
  readinessValue?: number;
  /** @default 'READINESS' */
  readinessLabel?: string;
  /** @default 'Your readiness model' */
  readinessCaption?: string;
  /** Accessible name shared by both tablists — the ring nodes and the mobile ribbon are two
   *  views of the same four steps. @default 'Loop steps' */
  tablistLabel?: string;
  /** Step shown selected on first render. @default 0 */
  defaultActiveIndex?: number;
}

const NODE_POSITIONS = [
  { left: 260, top: 40 },
  { left: 85, top: 215 },
  { left: 260, top: 390 },
  { left: 435, top: 215 },
] as const;

// Illustrative topic-mastery sparkline in the readiness card — mirrors the shipped
// page's handcrafted values; it's not wired to real data, same as the rest of this DS.
const HEAT_CELLS: Array<{ opacity: number; warm?: true }> = [
  { opacity: 0.6 }, { opacity: 0.68 }, { opacity: 0.5 }, { opacity: 0.62 },
  { opacity: 0.5, warm: true }, { opacity: 0.7 }, { opacity: 0.44 }, { opacity: 0.58 },
  { opacity: 0.4 }, { opacity: 0.46, warm: true }, { opacity: 0.66 }, { opacity: 0.36 },
];

/** data-loop-accent is only rendered for the two non-default tracks — the CSS base rule already covers 'cyan'. */
function accentAttr(accent: FeaturesLoopAccent = 'cyan'): FeaturesLoopAccent | undefined {
  return accent === 'cyan' ? undefined : accent;
}

/**
 * Features section built as a four-step loop (Practice → Understand → Review & Retain →
 * Compete) around a readiness ring, with one detail panel that swaps per step. Below 980px
 * the ring is replaced by a pill ribbon — same four tabs, same four panels. Two tablists
 * (ring nodes + ribbon) share one set of panels; only one tablist is visible at a time.
 *
 * As in the shipped page, this component only ever toggles aria-selected/hidden — every
 * visual state (accent colour, selected fill, focus ring) is decided by the CSS shipped in
 * `styles.css` off those attributes, not written here.
 */
export function FeaturesLoop({
  eyebrow,
  title,
  description,
  steps,
  readinessValue = 92,
  readinessLabel = 'READINESS',
  readinessCaption = 'Your readiness model',
  tablistLabel = 'Loop steps',
  defaultActiveIndex = 0,
}: FeaturesLoopProps) {
  const uid = React.useId();
  const [active, setActive] = React.useState(defaultActiveIndex);
  const nodeRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const pillRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const panelId = (i: number) => `${uid}-loop-panel-${i}`;

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLButtonElement>) {
    const count = steps.length;
    let next: number | null = null;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % count;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + count) % count;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    // Only one of the two tablists is on screen at the current viewport; focus has to land in that one.
    const pill = pillRefs.current[next];
    const target = pill && pill.offsetParent ? pill : nodeRefs.current[next];
    target?.focus();
  }

  return (
    <section className="ds-loop-section" style={{ padding: '96px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 13, letterSpacing: '.14em', color: 'var(--ds-cyan)' }}>{eyebrow}</span>
          <h2 style={{ margin: '12px 0 0', fontSize: 42, fontWeight: 700, color: '#F1F7FC', lineHeight: 1.25 }}>{title}</h2>
          <p style={{ margin: '16px auto 0', maxWidth: 660, fontSize: 17, lineHeight: 1.7, color: 'var(--ds-text-onDark-secondary)' }}>{description}</p>
        </div>

        <div className="ds-loop-grid">
          {/* Below 980px the ring is replaced by this ribbon: same four tabs, same four
              panels, no SVG to squeeze onto a phone. */}
          <div className="ds-loop-ribbon" role="tablist" aria-label={tablistLabel}>
            {steps.map((step, i) => (
              <React.Fragment key={step.number}>
                {i > 0 && <i aria-hidden="true" />}
                <button
                  ref={(el) => { pillRefs.current[i] = el; }}
                  type="button"
                  role="tab"
                  className="ds-loop-pill"
                  data-loop-accent={accentAttr(step.accent)}
                  aria-controls={panelId(i)}
                  aria-selected={active === i}
                  tabIndex={active === i ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                >
                  {step.number} · {step.shortLabel ?? step.label}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="ds-loop-ring">
            <svg viewBox="0 0 520 480" width={520} height={480} aria-hidden="true" focusable="false">
              <circle cx={260} cy={215} r={175} fill="none" stroke="#14395C" strokeWidth={2} />
              {/* Solid where the loop is shipped (01→03), dashed where it is not (03→04→01). */}
              <path d="M 260 40 A 175 175 0 0 0 260 390" fill="none" stroke="var(--ds-cyan)" strokeWidth={2.5} />
              <path d="M 260 390 A 175 175 0 0 0 260 40" fill="none" stroke="var(--ds-navy-border)" strokeWidth={2} strokeDasharray="6 9" />
              <path
                className="ds-loop-comet"
                d="M 260 40 A 175 175 0 0 0 260 390 A 175 175 0 0 0 260 40"
                fill="none"
                stroke="#8CF0FF"
                strokeWidth={3.5}
                strokeLinecap="round"
                opacity={0.95}
              />
            </svg>

            <div className="ds-loop-center">
              <span className="ds-loop-center-label">{readinessLabel}</span>
              <span className="ds-loop-center-value">{readinessValue}%</span>
              <div className="ds-loop-heat" aria-hidden="true">
                {HEAT_CELLS.map((cell, i) => (
                  <i key={i} className={cell.warm ? 'ds-loop-heat-warm' : undefined} style={{ opacity: cell.opacity }} />
                ))}
              </div>
              <span className="ds-loop-center-caption">{readinessCaption}</span>
            </div>

            <div className="ds-loop-nodes" role="tablist" aria-label={tablistLabel}>
              {steps.map((step, i) => {
                const isChip = NODE_POSITIONS[i].top === 215;
                return (
                  <button
                    key={step.number}
                    ref={(el) => { nodeRefs.current[i] = el; }}
                    type="button"
                    role="tab"
                    className="ds-loop-node"
                    data-loop-accent={accentAttr(step.accent)}
                    aria-controls={panelId(i)}
                    aria-selected={active === i}
                    tabIndex={active === i ? 0 : -1}
                    style={{ left: NODE_POSITIONS[i].left, top: NODE_POSITIONS[i].top }}
                    onClick={() => setActive(i)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                  >
                    <span className="ds-loop-dot">{step.number}</span>
                    <span className={isChip ? 'ds-loop-label ds-loop-label-chip' : 'ds-loop-label'}>{step.label}</span>
                    {step.flagLabel && <span className="ds-loop-soon-badge">{step.flagLabel}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* All four panels render; only the active one is visible. Without JS-driven
              selection the copy is still readable, stacked. */}
          <div className="ds-loop-panels">
            {steps.map((step, i) => (
              <div
                key={step.number}
                id={panelId(i)}
                className="ds-loop-panel"
                data-loop-accent={accentAttr(step.accent)}
                role="tabpanel"
                tabIndex={0}
                aria-label={`Step ${step.number} · ${step.label}`}
                hidden={active !== i}
              >
                <div className="ds-loop-panel-top">
                  <span className="ds-loop-tag">Step {step.number} · {step.tagStatus}</span>
                  <span className="ds-loop-rule" />
                  <span className="ds-loop-status">{step.statusLabel}</span>
                </div>
                <h3>{step.heading}</h3>
                <p className="ds-loop-lead">{step.lead}</p>
                <ul className="ds-loop-points">
                  {step.points.map((point, pi) => (
                    <li key={pi}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
