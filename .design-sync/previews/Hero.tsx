import * as React from 'react';
import { Hero } from 'meduxa-landing-ds';

export function Default() {
  return (
    <Hero
      eyebrow="Science-Based Learning · AI-Powered"
      titleLine1="The smarter way to prepare"
      titleAccent="for medical boards"
      subtitle="Active recall, spaced repetition, and a Socratic AI tutor — all grounded in the real sources your exam is written from. Built for medical residents, worldwide."
      primaryCtaHref="#pilot"
      primaryCtaLabel="Start studying free"
      secondaryCtaHref="#how"
      secondaryCtaLabel="See how it works"
      stats={[
        { value: '1,000+', label: 'Board-style questions' },
        { value: '9', label: 'Evidence-based principles' },
        { value: '100%', label: 'Source-cited answers' },
        { value: 'AI', label: 'Socratic tutor per question' },
      ]}
      demo={{
        questionId: 'Q-1838 · AKI',
        reviewLabel: 'Scheduled review · day 6',
        question:
          'A 67-year-old man with diabetic CKD undergoes coronary catheterization. Creatinine was 1.5 mg/dL before the procedure, 1.77 mg/dL two days later. Per KDIGO criteria, which is correct?',
        options: [
          { text: 'Does not meet AKI criteria', selected: true },
          { text: 'Has AKI stage 1' },
          { text: 'Has AKI stage 2' },
          { text: 'Has AKI stage 3' },
        ],
        tutorTip: 'Before we choose — what are the two KDIGO thresholds, absolute and relative, that define AKI?',
        tutorTag: 'KDIGO staging',
        progress: 68,
        progressLabel: '17/25',
      }}
    />
  );
}
