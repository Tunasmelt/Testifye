'use client';

interface TabItem {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ items, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`tf-tabs ${className}`}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`tf-tab ${active === item.key ? 'active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          {item.label}
          {item.count !== undefined && (
            <span style={{ marginLeft: 6, opacity: 0.7, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
