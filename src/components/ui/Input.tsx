import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, className = '', ...rest }, ref) => {
    const inputId = id ?? `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label htmlFor={inputId} className="tf-label">
            {label}
            {hint && <span className="tf-label-hint" style={{ marginLeft: 6 }}>{hint}</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`tf-input ${error ? 'error' : ''} ${className}`}
          style={error ? { borderColor: 'var(--error)', boxShadow: '0 0 0 3px rgba(248,113,113,0.12)' } : undefined}
          {...rest}
        />
        {error && (
          <span style={{ fontSize: 11, color: 'var(--error)' }}>{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, id, className = '', ...rest }, ref) => {
    const inputId = id ?? `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label htmlFor={inputId} className="tf-label">
            {label}
            {hint && <span className="tf-label-hint" style={{ marginLeft: 6 }}>{hint}</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`tf-textarea ${error ? 'error' : ''} ${className}`}
          style={error ? { borderColor: 'var(--error)', boxShadow: '0 0 0 3px rgba(248,113,113,0.12)' } : undefined}
          {...rest}
        />
        {error && (
          <span style={{ fontSize: 11, color: 'var(--error)' }}>{error}</span>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
