import * as React from 'react';
import { PrincipleCard } from 'meduxa-landing-ds';

export function Default() {
  return <PrincipleCard index="01" title="Active Recall" description="Learning is driven by retrieving answers, not re-reading them. Every session forces retrieval." />;
}

export function Grid() {
  const items = [
    { index: '02', title: 'Spaced Repetition', description: 'Review is scheduled to fight the forgetting curve — questions resurface exactly when memory fades.' },
    { index: '06', title: 'Self-Explanation', description: 'Before the answer unlocks, you explain your reasoning in your own words — the single act that deepens understanding most.' },
    { index: '09', title: 'Source-Grounded Truth', description: 'Every explanation is backed by a verbatim citation from the textbook. Never a hallucination.' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
      {items.map((p) => (
        <PrincipleCard key={p.index} {...p} />
      ))}
    </div>
  );
}
