import * as React from 'react';
import { WaitlistForm } from 'meduxa-landing-ds';

const wrap: React.CSSProperties = { background: '#fff', padding: 24, display: 'flex', justifyContent: 'center' };

export function Idle() {
  return (
    <div style={wrap}>
      <WaitlistForm placeholder="Your email" submitLabel="Get early access" helperText="free early access · no spam" />
    </div>
  );
}

export function Submitting() {
  return (
    <div style={wrap}>
      <WaitlistForm placeholder="Your email" submitLabel="Get early access" helperText="free early access · no spam" state="submitting" />
    </div>
  );
}

export function Success() {
  return (
    <div style={wrap}>
      <WaitlistForm placeholder="Your email" submitLabel="Get early access" helperText="free early access · no spam" state="success" />
    </div>
  );
}

export function ErrorState() {
  return (
    <div style={wrap}>
      <WaitlistForm placeholder="Your email" submitLabel="Get early access" helperText="free early access · no spam" state="error" />
    </div>
  );
}
