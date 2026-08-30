import * as React from 'react';
import { Logo } from './Logo';
import { Button } from './Button';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavbarProps {
  links: NavLink[];
  langHref?: string;
  langLabel?: string;
  ctaHref: string;
  ctaLabel: string;
  ctaLabelShort?: string;
}

/** Sticky top navigation bar — logo, section links, language switch, CTA, and a mobile hamburger menu. */
export function Navbar({ links, langHref = '/?lang=he', langLabel = 'עברית', ctaHref, ctaLabel, ctaLabelShort = 'Join' }: NavbarProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,18,37,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(34,211,238,.15)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          {links.map((l) => (
            <a key={l.href} className="ds-nav-link" href={l.href}>
              {l.label}
            </a>
          ))}
          <a href={langHref} style={{ color: 'var(--ds-cyan-pale)', fontSize: 14, fontWeight: 600, border: '1px solid var(--ds-navy-border)', borderRadius: 8, padding: '7px 14px', textDecoration: 'none' }}>
            {langLabel}
          </a>
          <Button href={ctaHref} variant="action" size="md">
            {ctaLabel}
          </Button>
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            style={{ background: 'transparent', border: '1px solid var(--ds-navy-border)', borderRadius: 8, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5 H 17 M 3 10 H 17 M 3 15 H 17" stroke="var(--ds-cyan-pale)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div style={{ display: 'flex', background: 'rgba(6,18,37,.98)', borderBottom: '1px solid rgba(34,211,238,.15)', flexDirection: 'column', padding: '12px 24px 20px', gap: 4 }}>
          {links.map((l) => (
            <a key={l.href} className="ds-m-link" href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
