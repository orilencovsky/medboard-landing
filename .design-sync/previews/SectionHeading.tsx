import * as React from 'react';
import { SectionHeading } from 'meduxa-landing-ds';

export function Science() {
  return (
    <SectionHeading
      eyebrow="THE SCIENCE"
      title="Learning backed by how the brain actually works"
      subtitle="MeduXa is built on nine evidence-based learning principles — with an AI layer that adapts to each student."
    />
  );
}

export function Features() {
  return (
    <SectionHeading
      eyebrow="FEATURES"
      title="Everything you need to pass — nothing you don't"
      subtitle="One platform for questions, review, AI chat, and progress tracking. No juggling apps."
    />
  );
}

export function DarkVision() {
  return (
    <div style={{ background: '#0A1F3D', padding: 24 }}>
      <SectionHeading eyebrow="THE VISION" title="One engine, every board exam" theme="dark" />
    </div>
  );
}
