import * as React from 'react';
import { Badge } from 'meduxa-landing-ds';

const dark: React.CSSProperties = { background: '#0A1F3D', padding: 24, display: 'inline-flex', gap: 12, flexWrap: 'wrap' };

export function LiveStatus() {
  return (
    <div style={dark}>
      <Badge withDot>Science-Based Learning · AI-Powered</Badge>
    </div>
  );
}

export function TealLive() {
  return (
    <div style={dark}>
      <Badge tone="teal">✓ Nephrology (Stage A) — live now</Badge>
    </div>
  );
}

export function Muted() {
  return (
    <div style={dark}>
      <Badge tone="muted">More specialties coming</Badge>
    </div>
  );
}
