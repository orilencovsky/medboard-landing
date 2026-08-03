import * as React from 'react';

export interface StatItemProps {
  /** The big mono-font number, e.g. "1,000+" */
  value: string;
  /** The caption underneath */
  label: string;
}

/** A single stat in the hero's stat row (value + label pair, mono-font number). */
export function StatItem({ value, label }: StatItemProps) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 28, fontWeight: 500, color: 'var(--ds-cyan)' }}>{value}</div>
      <div style={{ fontSize: 14, color: 'var(--ds-text-onDark-muted)' }}>{label}</div>
    </div>
  );
}
