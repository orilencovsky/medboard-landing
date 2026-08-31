import * as React from 'react';

export interface WaitlistFormProps {
  placeholder: string;
  submitLabel: string;
  helperText: string;
  /** Called with the submitted email; the host app owns the actual network call. */
  onSubmit?: (email: string) => void;
  /** Force a visual state for previews: 'idle' | 'submitting' | 'success' | 'error'. @default 'idle' */
  state?: 'idle' | 'submitting' | 'success' | 'error';
  successText?: string;
  errorText?: string;
}

/** Email capture form used in the pilot CTA section, with submitting/success/error states. */
export function WaitlistForm({ placeholder, submitLabel, helperText, onSubmit, state = 'idle', successText = "✓ You're on the list — we'll be in touch.", errorText = 'Something went wrong — please try again.' }: WaitlistFormProps) {
  const [email, setEmail] = React.useState('');

  if (state === 'success') {
    return <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 13, color: 'var(--ds-text-cyan-accent)' }}>{successText}</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%', maxWidth: 520 }}>
      <form
        style={{ display: 'flex', gap: 12, width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(email);
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className="ds-input-action"
          style={{ flex: 1, minWidth: 220, background: 'var(--ds-bg-app)', border: '1px solid var(--ds-border-input)', borderRadius: 'var(--ds-radius-md)', padding: '15px 20px', fontSize: 16, color: 'var(--ds-text-heading)', fontFamily: 'var(--ds-font-sans)', outline: 'none' }}
        />
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="ds-btn-action"
          style={{ background: 'var(--ds-gradient-action)', color: '#fff', border: 'none', borderRadius: 'var(--ds-radius-md)', padding: '15px 30px', fontSize: 16, fontWeight: 700, fontFamily: 'var(--ds-font-sans)', cursor: 'pointer', whiteSpace: 'nowrap', opacity: state === 'submitting' ? 0.7 : 1 }}
        >
          {state === 'submitting' ? '…' : submitLabel}
        </button>
      </form>
      <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 13, color: state === 'error' ? 'var(--ds-danger)' : 'var(--ds-text-faint)' }}>
        {state === 'error' ? errorText : helperText}
      </span>
    </div>
  );
}
