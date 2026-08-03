import * as React from 'react';
import { VisionSection } from 'meduxa-landing-ds';

export function Default() {
  return (
    <VisionSection
      eyebrow="THE VISION"
      title="One engine, every board exam"
      description="MeduXa is subject-agnostic — the same science-backed engine can power any structured board exam, in any specialty. The first exam track is live in the pilot right now, with more subjects rolling out."
      quote='"One platform to rule them all."'
      pills={[
        { label: '✓ Nephrology (Stage A) — live now', tone: 'teal' },
        { label: 'More specialties coming', tone: 'muted' },
      ]}
    />
  );
}
