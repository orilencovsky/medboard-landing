import * as React from 'react';

export interface StepCardProps {
  /** Step number shown in the gradient chip, e.g. 1 */
  step: number;
  title: string;
  description: string;
}

/** White card used in the "How it works" grid — numbered gradient chip + title + copy. */
export function StepCard({ step, title, description }: StepCardProps) {
  return (
    <div style={{ background: 'var(--ds-bg-white)', border: '1px solid var(--ds-border-light)', borderRadius: 'var(--ds-radius-lg)', padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--ds-radius-md)',
          background: 'var(--ds-gradient-cta)',
          color: '#062033',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--ds-font-mono)',
          fontSize: 20,
          fontWeight: 500,
        }}
      >
        {step}
      </div>
      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ds-text-heading)' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--ds-text-body)', lineHeight: 1.65 }}>{description}</p>
    </div>
  );
}
