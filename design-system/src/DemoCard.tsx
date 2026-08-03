import * as React from 'react';

export interface DemoCardOption {
  text: string;
  /** Marks this option as the highlighted/selected answer. */
  selected?: boolean;
}

export interface DemoCardProps {
  questionId: string;
  reviewLabel: string;
  question: string;
  options: DemoCardOption[];
  tutorTip: string;
  tutorTag?: string;
  /** 0-100 */
  progress: number;
  progressLabel: string;
}

/** Product-preview widget shown beside the hero copy — a live practice question with the AI tutor prompt and progress bar. */
export function DemoCard({ questionId, reviewLabel, question, options, tutorTip, tutorTag, progress, progressLabel }: DemoCardProps) {
  return (
    <div
      style={{
        background: 'var(--ds-navy-card)',
        border: '1px solid var(--ds-navy-border)',
        borderRadius: 'var(--ds-radius-xl)',
        padding: 26,
        boxShadow: '0 30px 80px rgba(2,8,20,.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        maxWidth: 520,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 13, color: 'var(--ds-text-onDark-faint)' }}>{questionId}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ds-teal)' }}>{reviewLabel}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#E2F4FD', lineHeight: 1.6 }}>{question}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt, i) => (
          <div
            key={i}
            style={
              opt.selected
                ? { border: '1px solid var(--ds-cyan)', background: 'rgba(34,211,238,.08)', borderRadius: 10, padding: '12px 16px', fontSize: 15, color: '#67E8F9', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
                : { border: '1px solid var(--ds-navy-border)', borderRadius: 10, padding: '12px 16px', fontSize: 15, color: 'var(--ds-text-onDark-secondary)' }
            }
          >
            <span>{opt.text}</span>
            {opt.selected && <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 12 }}>✓</span>}
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--ds-navy-tint)', border: '1px solid var(--ds-navy-line)', borderRadius: 'var(--ds-radius-md)', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <svg width="22" height="22" viewBox="0 0 96 96" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
          <path d="M18 74 C 30 70, 40 60, 48 48 C 56 36, 66 26, 78 22" stroke="var(--ds-sky-light)" strokeWidth="8" strokeLinecap="round" fill="none" />
          <circle cx="48" cy="48" r="11" fill="var(--ds-cyan)" />
        </svg>
        <div style={{ fontSize: 14, color: 'var(--ds-text-onDark-nav)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--ds-cyan)', fontWeight: 600 }}>AI tutor:</span> {tutorTip}{' '}
          {tutorTag && <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 12, color: 'var(--ds-text-onDark-faint)', display: 'inline-block' }}>[{tutorTag}]</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--ds-navy-line)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--ds-gradient-cta)' }} />
        </div>
        <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 12, color: 'var(--ds-text-onDark-faint)' }}>{progressLabel}</span>
      </div>
    </div>
  );
}
