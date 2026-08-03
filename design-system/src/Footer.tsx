import * as React from 'react';

export interface FooterProps {
  copyrightLine: string;
}

/** Site footer — small wordmark on the left, copyright line on the right. */
export function Footer({ copyrightLine }: FooterProps) {
  return (
    <footer style={{ background: 'var(--ds-footer-ink)', padding: '36px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ds-text-onDark-muted)' }}>MeduXa</span>
          <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 17, color: 'var(--ds-cyan)' }}>.ai</span>
        </span>
        <span style={{ fontSize: 14, color: 'var(--ds-text-onDark-faint)' }}>{copyrightLine}</span>
      </div>
    </footer>
  );
}
