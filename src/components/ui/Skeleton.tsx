interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width, height, className = '', style }: SkeletonProps) {
  return (
    <div
      className={`tf-skeleton ${className}`}
      style={{ width, height, ...style }}
    />
  );
}

export function SkeletonText({ lines = 2 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="tf-skeleton-text"
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
}
