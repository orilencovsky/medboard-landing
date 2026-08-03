import * as React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler;
  type?: 'button' | 'submit';
  /** @default 'primary' */
  variant?: 'primary' | 'secondary';
  /** @default 'md' */
  size?: 'md' | 'lg';
  disabled?: boolean;
}

const base: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--ds-font-sans)',
  fontWeight: 700,
  textDecoration: 'none',
  cursor: 'pointer',
  border: 'none',
  whiteSpace: 'nowrap',
};

const sizes = {
  md: { borderRadius: 10, padding: '10px 22px', fontSize: 15 },
  lg: { borderRadius: 12, padding: '16px 34px', fontSize: 18 },
};

const variants: Record<string, React.CSSProperties> = {
  primary: {
    background: 'var(--ds-gradient-cta)',
    color: '#062033',
    boxShadow: '0 6px 24px rgba(14,165,233,.4)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--ds-cyan-pale)',
    border: '1.5px solid var(--ds-navy-border)',
    boxShadow: 'none',
  },
};

/** MeduXa CTA button — gradient-filled primary or outlined secondary, used across nav, hero, and pilot sections. */
export function Button({ children, href, onClick, type = 'button', variant = 'primary', size = 'md', disabled }: ButtonProps) {
  const style = { ...base, ...sizes[size], ...variants[variant], opacity: disabled ? 0.6 : 1 };
  if (href) {
    return (
      <a href={href} style={style} onClick={onClick as any}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}
