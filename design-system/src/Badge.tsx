import * as React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  /** @default 'cyan' */
  tone?: 'cyan' | 'teal' | 'muted';
  /** Show the pulsing status dot (used for "live" indicators). @default false */
  withDot?: boolean;
}

const tones: Record<string, { color: string; border: string; bg: string; dot?: string }> = {
  cyan: { color: '#67E8F9', border: 'rgba(34,211,238,.3)', bg: 'rgba(34,211,238,.08)', dot: 'var(--ds-cyan)' },
  teal: { color: 'var(--ds-teal)', border: 'rgba(94,234,212,.35)', bg: 'rgba(94,234,212,.08)' },
  muted: { color: 'var(--ds-text-onDark-muted)', border: 'var(--ds-navy-border)', bg: 'rgba(34,211,238,.06)' },
};

/** Pill-shaped status/eyebrow badge used in the hero and vision sections. */
export function Badge({ children, tone = 'cyan', withDot = false }: BadgeProps) {
  const t = tones[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.color,
        borderRadius: 'var(--ds-radius-pill)',
        padding: '7px 18px',
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'var(--ds-font-sans)',
      }}
    >
      {withDot && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: t.dot ?? t.color,
            display: 'inline-block',
            animation: 'ds-dot-pulse 2s infinite',
          }}
        />
      )}
      {children}
    </span>
  );
}
