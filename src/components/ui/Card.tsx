interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CardHeaderProps {
  title: React.ReactNode;
  action?: React.ReactNode;
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <div className={`tf-card ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className="tf-card-head">
      <div className="tf-card-title">{title}</div>
      {action && <div>{action}</div>}
    </div>
  );
}
