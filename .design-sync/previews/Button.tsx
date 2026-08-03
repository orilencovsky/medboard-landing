import * as React from 'react';
import { Button } from 'meduxa-landing-ds';

const dark: React.CSSProperties = { background: '#0A1F3D', padding: 24, display: 'inline-flex' };

export function Primary() {
  return <Button href="#pilot">Start studying free</Button>;
}

export function Secondary() {
  return (
    <div style={dark}>
      <Button href="#how" variant="secondary">
        See how it works
      </Button>
    </div>
  );
}

export function LargePrimary() {
  return (
    <Button href="#pilot" size="lg">
      Start studying free
    </Button>
  );
}

export function Disabled() {
  return (
    <div style={dark}>
      <Button variant="secondary" disabled>
        Get early access
      </Button>
    </div>
  );
}
