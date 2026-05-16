'use client';
import { forwardRef } from 'react';

type Variant = 'default' | 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', loading, disabled, children, className = '', ...rest }, ref) => {
    const cls = [
      'tf-btn',
      variant === 'primary' ? 'tf-btn-primary' : '',
      variant === 'ghost'   ? 'tf-btn-ghost'   : '',
      variant === 'danger'  ? 'tf-btn-danger'  : '',
      size === 'sm'   ? 'tf-btn-sm'   : '',
      size === 'lg'   ? 'tf-btn-lg'   : '',
      size === 'icon' ? 'tf-btn-icon' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <button ref={ref} className={cls} disabled={disabled || loading} {...rest}>
        {loading && (
          <svg
            className="tf-spin"
            style={{ width: 14, height: 14, flexShrink: 0 }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
