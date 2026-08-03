import * as React from 'react';

export interface SectionHeadingProps {
  /** Small mono-font uppercase label above the heading, e.g. "THE SCIENCE" */
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** @default 'light' — set 'dark' for use on the navy Vision section */
  theme?: 'light' | 'dark';
  align?: 'center' | 'left';
}

/** Centered eyebrow + H2 + subtitle block that opens every content section. */
export function SectionHeading({ eyebrow, title, subtitle, theme = 'light', align = 'center' }: SectionHeadingProps) {
  const isDark = theme === 'dark';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        gap: 14,
        textAlign: align,
        marginBottom: 52,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--ds-font-mono)',
          fontSize: 13,
          letterSpacing: '.14em',
          color: isDark ? 'var(--ds-cyan)' : 'var(--ds-text-cyan-accent)',
        }}
      >
        {eyebrow}
      </span>
      <h2 style={{ margin: 0, fontSize: 40, fontWeight: 700, color: isDark ? '#fff' : 'var(--ds-text-heading)' }}>{title}</h2>
      {subtitle && (
        <p style={{ margin: 0, fontSize: 18, color: isDark ? 'var(--ds-text-onDark-secondary)' : 'var(--ds-text-body)', maxWidth: 640, lineHeight: 1.65 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
