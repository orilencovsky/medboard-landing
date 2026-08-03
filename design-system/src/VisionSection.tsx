import * as React from 'react';
import { SectionHeading } from './SectionHeading';
import { Badge } from './Badge';

export interface VisionPill {
  label: string;
  tone?: 'teal' | 'muted';
}

export interface VisionSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  quote: string;
  pills: VisionPill[];
}

/** Dark full-width section stating the product vision, with a pull-quote and status pills. */
export function VisionSection({ eyebrow, title, description, quote, pills }: VisionSectionProps) {
  return (
    <section style={{ background: 'var(--ds-gradient-vision-bg)', padding: '96px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
        <SectionHeading eyebrow={eyebrow} title={title} theme="dark" />
        <p style={{ margin: '-36px 0 0', fontSize: 19, color: 'var(--ds-text-onDark-secondary)', lineHeight: 1.7, maxWidth: 700 }}>{description}</p>
        <p style={{ margin: 0, fontSize: 20, color: 'var(--ds-cyan-soft)', fontWeight: 600, fontStyle: 'italic' }}>{quote}</p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          {pills.map((p) => (
            <Badge key={p.label} tone={p.tone ?? 'muted'}>
              {p.label}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
