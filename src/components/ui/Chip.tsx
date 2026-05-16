'use client';

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Chip({ active, onClick, children, className = '' }: ChipProps) {
  return (
    <button
      type="button"
      className={`tf-chip ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
