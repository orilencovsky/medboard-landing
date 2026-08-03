import * as React from 'react';

export interface LogoProps {
  /** Mark + wordmark size in px. @default 36 */
  size?: number;
  /** Show the "MeduXa.ai" wordmark next to the mark. @default true */
  withWordmark?: boolean;
  /** Wordmark color when on a dark background. @default '#ffffff' */
  wordmarkColor?: string;
}

/**
 * MeduXa brand mark: a rounded-square badge with two crossing curves and a
 * cyan intersection point, optionally paired with the "MeduXa.ai" wordmark.
 */
export function Logo({ size = 36, withWordmark = true, wordmarkColor = '#ffffff' }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
        <rect x="2" y="2" width="92" height="92" rx="22" fill="var(--ds-navy-card)" />
        <rect x="2" y="2" width="92" height="92" rx="22" stroke="var(--ds-cyan)" strokeWidth="3" />
        <path d="M18 22 C 30 26, 40 36, 48 48 C 56 60, 66 70, 78 74" stroke="var(--ds-navy-border)" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M18 74 C 30 70, 40 60, 48 48 C 56 36, 66 26, 78 22" stroke="var(--ds-sky-light)" strokeWidth="7" strokeLinecap="round" fill="none" />
        <circle cx="48" cy="48" r="9" fill="var(--ds-cyan)" />
      </svg>
      {withWordmark && (
        <span style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: size * 0.58, fontWeight: 700, color: wordmarkColor, letterSpacing: '-0.02em' }}>MeduXa</span>
          <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: size * 0.58, color: 'var(--ds-cyan)' }}>.ai</span>
        </span>
      )}
    </div>
  );
}
