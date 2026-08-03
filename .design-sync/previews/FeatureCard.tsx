import * as React from 'react';
import { FeatureCard } from 'meduxa-landing-ds';

export function Default() {
  return <FeatureCard title="Curated question bank" description="Thousands of board-style questions built on past exams, each vetted through expert review before reaching you." />;
}

export function Grid() {
  const items = [
    { title: 'AI question generator', description: 'The AI drafts smart new questions from the learned material, grounded in source texts and routed through human review.' },
    { title: 'Socratic AI chat (per question)', description: 'Stuck on a question? The AI tutor guides you with questions rather than just giving the answer — streamed in real time.' },
    { title: 'Topic heat map', description: 'See which topics are red, yellow, or green. Know exactly where to focus before exam day.' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, background: '#fff', padding: 4 }}>
      {items.map((f) => (
        <FeatureCard key={f.title} {...f} />
      ))}
    </div>
  );
}
