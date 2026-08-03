import * as React from 'react';
import { DemoCard } from 'meduxa-landing-ds';

const dark: React.CSSProperties = { background: '#0A1F3D', padding: 32, display: 'inline-flex' };

export function Default() {
  return (
    <div style={dark}>
      <DemoCard
        questionId="Q-1838 · AKI"
        reviewLabel="Scheduled review · day 6"
        question="A 67-year-old man with diabetic CKD undergoes coronary catheterization. Creatinine was 1.5 mg/dL before the procedure, 1.77 mg/dL two days later. Per KDIGO criteria, which is correct?"
        options={[
          { text: 'Does not meet AKI criteria', selected: true },
          { text: 'Has AKI stage 1' },
          { text: 'Has AKI stage 2' },
          { text: 'Has AKI stage 3' },
        ]}
        tutorTip="Before we choose — what are the two KDIGO thresholds, absolute and relative, that define AKI?"
        tutorTag="KDIGO staging"
        progress={68}
        progressLabel="17/25"
      />
    </div>
  );
}
