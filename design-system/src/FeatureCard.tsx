import * as React from 'react';

export interface FeatureCardProps {
  title: string;
  description: string;
}

/**
 * Tinted card — gradient dot + title + copy. No longer used by the landing page: Features
 * is now `FeaturesLoop`. Kept as a generic small-card primitive (distinct from the white
 * `StepCard`/`PrincipleCard` chip layouts) for other grids that want this lighter weight.
 */
export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div style={{ background: 'var(--ds-bg-app)', border: '1px solid var(--ds-border-light)', borderRadius: 'var(--ds-radius-lg)', padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ds-text-heading)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--ds-gradient-cta)', display: 'inline-block', flexShrink: 0 }} />
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--ds-text-body)', lineHeight: 1.65 }}>{description}</p>
    </div>
  );
}
