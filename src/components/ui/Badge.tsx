type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'success' | 'violet' | 'info' | 'warning';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  critical: 'tf-badge-critical',
  high:     'tf-badge-high',
  medium:   'tf-badge-medium',
  low:      'tf-badge-low',
  success:  'tf-badge-success',
  violet:   'tf-badge-violet',
  info:     'tf-badge-info',
  warning:  'tf-badge-warning',
};

export function Badge({ variant = 'low', children, className = '' }: BadgeProps) {
  return (
    <span className={`tf-badge ${variantMap[variant]} ${className}`}>
      {children}
    </span>
  );
}

/** Maps priority string to badge variant */
export function priorityVariant(p: string): BadgeVariant {
  const m: Record<string, BadgeVariant> = {
    critical: 'critical',
    high:     'high',
    medium:   'medium',
    low:      'low',
  };
  return m[p?.toLowerCase()] ?? 'low';
}
