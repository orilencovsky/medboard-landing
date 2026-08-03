import * as React from 'react';
import { StepCard } from 'meduxa-landing-ds';

export function Default() {
  return <StepCard step={1} title="Pick your topic" description="Filter by specialty, year, or difficulty and start a practice or exam session." />;
}

export function Sequence() {
  const steps = [
    { step: 1, title: 'Pick your topic', description: 'Filter by specialty, year, or difficulty and start a practice or exam session.' },
    { step: 2, title: 'Answer & learn', description: 'Submit an answer and instantly get a source-grounded explanation with verbatim textbook citations.' },
    { step: 3, title: 'Chat with the AI tutor', description: 'Not satisfied? Open the AI chat — it asks you guiding questions to deepen understanding, not just repeat the answer.' },
    { step: 4, title: 'Review what you missed', description: 'The spaced repetition engine brings back questions you struggled with at the optimal time.' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
      {steps.map((s) => (
        <StepCard key={s.step} {...s} />
      ))}
    </div>
  );
}
