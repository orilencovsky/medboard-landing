import * as React from 'react';
import { StatItem } from 'meduxa-landing-ds';

const dark: React.CSSProperties = { background: '#0A1F3D', padding: 24, display: 'inline-flex' };

export function Default() {
  return (
    <div style={dark}>
      <StatItem value="1,000+" label="Board-style questions" />
    </div>
  );
}

export function StatsRow() {
  return (
    <div style={{ ...dark, gap: 32, flexWrap: 'wrap' }}>
      <StatItem value="1,000+" label="Board-style questions" />
      <StatItem value="9" label="Evidence-based principles" />
      <StatItem value="100%" label="Source-cited answers" />
      <StatItem value="AI" label="Socratic tutor per question" />
    </div>
  );
}
