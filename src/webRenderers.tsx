// webRenderers.tsx
import React from 'react';
import type { RendererProps, InputRenderers } from './types';

/** TEXT/EMAIL/PASSWORD share the same component (string in, string out) */
export function TextInputModal({ prompt, queueLength, onSubmit, onCancel }: RendererProps<string>) {
  const [value, setValue] = React.useState<string>(prompt.defaultValue ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (prompt.required && value.trim() === '') return;
    onSubmit(value);
  }

  // Choose HTML input type based on prompt.kind (not required, just UI)
  const inputType =
    prompt.kind === 'password' ? 'password' :
    prompt.kind === 'email' ? 'email' :
    'text';

  return (
    <div style={overlayStyle} role="dialog" aria-modal>
      <div style={modalStyle}>
        {queueLength > 0 && (
          <div style={queueStyle}>
            {queueLength} more step{queueLength !== 1 ? 's' : ''} remaining
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="text-input" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              {prompt.message}
            </label>
            <input
              id="text-input"
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={prompt.placeholder}
              required={prompt.required}
              autoFocus
              style={inputStyle}
            />
          </div>
          <div style={buttonsRow}>
            <button type="button" onClick={onCancel} style={btnSecondary}>Cancel</button>
            <button type="submit" style={btnPrimary}>
              {queueLength > 0 ? 'Next' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** NUMBER modal returns a number (or null on cancel) */
export function NumberInputModal({ prompt, queueLength, onSubmit, onCancel }: RendererProps<number>) {
  const [raw, setRaw] = React.useState<string>(String(prompt.defaultValue ?? ''));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Empty string is null unless required
    if (raw === '') {
      if (prompt.required) return;
      onCancel(); // resolve null via provider
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n)) {
      if (prompt.required) return; // invalid
      onCancel();
      return;
    }
    onSubmit(n);
  }

  return (
    <div style={overlayStyle} role="dialog" aria-modal>
      <div style={modalStyle}>
        {queueLength > 0 && (
          <div style={queueStyle}>
            {queueLength} more step{queueLength !== 1 ? 's' : ''} remaining
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="number-input" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              {prompt.message}
            </label>
            <input
              id="number-input"
              type="number"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={prompt.placeholder}
              required={prompt.required}
              autoFocus
              style={inputStyle}
              inputMode="decimal"
            />
          </div>
          <div style={buttonsRow}>
            <button type="button" onClick={onCancel} style={btnSecondary}>Cancel</button>
            <button type="submit" style={btnPrimary}>
              {queueLength > 0 ? 'Next' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const webRenderers: InputRenderers = {
  /** generic string kinds */
  text: TextInputModal,
  email: TextInputModal,
  password: TextInputModal,
  /** number kind */
  number: NumberInputModal,
  /** fallback/default */
  default: TextInputModal,
};

/* ——— inline styles (unchanged visual language) ——— */

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: 24,
  borderRadius: 8,
  minWidth: 300,
  maxWidth: 420,
};

const queueStyle: React.CSSProperties = {
  marginBottom: 16,
  fontSize: 14,
  color: '#666',
  textAlign: 'center',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14,
};

const buttonsRow: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
};

const btnSecondary: React.CSSProperties = {
  padding: '8px 16px',
  border: '1px solid #ccc',
  borderRadius: 4,
  backgroundColor: '#f5f5f5',
  cursor: 'pointer',
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: 4,
  backgroundColor: '#007bff',
  color: 'white',
  cursor: 'pointer',
};