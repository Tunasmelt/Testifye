'use client';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, id, disabled }: ToggleProps) {
  const inputId = id ?? `toggle-${Math.random().toString(36).slice(2)}`;
  return (
    <label
      htmlFor={inputId}
      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
    >
      <span className="tf-toggle">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="tf-toggle-slider" />
      </span>
      {label && <span style={{ fontSize: 13, color: 'var(--text-0)' }}>{label}</span>}
    </label>
  );
}
