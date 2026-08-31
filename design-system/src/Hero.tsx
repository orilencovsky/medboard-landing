import * as React from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { StatItem, StatItemProps } from './StatItem';
import { DemoCard, DemoCardProps } from './DemoCard';

export interface HeroProps {
  eyebrow: string;
  titleLine1: string;
  titleAccent: string;
  subtitle: string;
  primaryCtaHref: string;
  primaryCtaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
  stats: StatItemProps[];
  demo: DemoCardProps;
}

/** Full hero header: looping-video-style gradient background, headline, CTAs, stat row, and the product demo card. */
export function Hero({ eyebrow, titleLine1, titleAccent, subtitle, primaryCtaHref, primaryCtaLabel, secondaryCtaHref, secondaryCtaLabel, stats, demo }: HeroProps) {
  return (
    <header style={{ background: 'var(--ds-gradient-hero-bg)', padding: '88px 32px 100px', position: 'relative', overflow: 'hidden' }}>
      <svg
        className="ds-mark"
        width="900"
        height="900"
        viewBox="0 0 96 96"
        fill="none"
        style={{ position: 'absolute', right: -260, top: -160, opacity: 0.07, pointerEvents: 'none' }}
      >
        <path d="M18 22 C 30 26, 40 36, 48 48 C 56 60, 66 70, 78 74" stroke="var(--ds-sky-light)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M18 74 C 30 70, 40 60, 48 48 C 56 36, 66 26, 78 22" stroke="var(--ds-cyan)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 64, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div style={{ alignSelf: 'flex-start' }}>
            <Badge withDot>{eyebrow}</Badge>
          </div>
          <h1 style={{ margin: 0, fontSize: 54, fontWeight: 700, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            {titleLine1}
            <br />
            <span style={{ background: 'var(--ds-gradient-heading-accent)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{titleAccent}</span>
          </h1>
          <p style={{ margin: 0, fontSize: 20, color: 'var(--ds-text-onDark-secondary)', lineHeight: 1.65, maxWidth: 540 }}>{subtitle}</p>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button href={primaryCtaHref} variant="action" size="lg">
              {primaryCtaLabel}
            </Button>
            <Button href={secondaryCtaHref} variant="secondary" size="lg">
              {secondaryCtaLabel}
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 32, marginTop: 8, flexWrap: 'wrap' }}>
            {stats.map((s) => (
              <StatItem key={s.label} {...s} />
            ))}
          </div>
        </div>
        <div style={{ flex: '1 1 420px', maxWidth: 520 }}>
          <DemoCard {...demo} />
        </div>
      </div>
    </header>
  );
}
