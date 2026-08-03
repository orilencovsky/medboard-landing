import * as React from 'react';

export interface PrincipleCardProps {
  /** Two-digit index, e.g. "01" */
  index: string;
  title: string;
  description: string;
}

/** White card used in the 9-principle "Science" grid — numbered chip + title + copy. */
export function PrincipleCard({ index, title, description }: PrincipleCardProps) {
  return (
    <div style={{ background: 'var(--ds-bg-white)', border: '1px solid var(--ds-border-light)', borderRadius: 'var(--ds-radius-lg)', padding: 26, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 13, color: 'var(--ds-sky)', background: '#E8F6FD', borderRadius: 'var(--ds-radius-sm)', padding: '4px 10px' }}>
          {index}
        </span>
        <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: 'var(--ds-text-heading)' }}>{title}</h3>
      </div>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--ds-text-body)', lineHeight: 1.65 }}>{description}</p>
    </div>
  );
}
