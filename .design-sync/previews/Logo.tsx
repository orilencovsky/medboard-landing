import * as React from 'react';
import { Logo } from 'meduxa-landing-ds';

const dark: React.CSSProperties = { background: '#061225', padding: 24, display: 'inline-flex' };

export function OnDark() {
  return (
    <div style={dark}>
      <Logo />
    </div>
  );
}

export function Large() {
  return (
    <div style={dark}>
      <Logo size={56} />
    </div>
  );
}

export function MarkOnly() {
  return (
    <div style={dark}>
      <Logo withWordmark={false} />
    </div>
  );
}
