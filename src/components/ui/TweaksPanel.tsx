'use client';
import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';

const THEMES = [
  { key: 'default',       label: 'Deep Obsidian', swatch: '#07070A', sub: 'Default dark theme' },
  { key: 'lighter-glass', label: 'Lighter Glass',  swatch: '#1A1623', sub: 'Purple-tinted surfaces' },
  { key: 'mono-violet',   label: 'Mono Violet',    swatch: '#0A0A0A', sub: 'Pure monochrome + violet' },
] as const;

type ThemeKey = typeof THEMES[number]['key'];

interface TweaksPanelProps {
  open: boolean;
  onClose: () => void;
}

function applyTheme(key: ThemeKey) {
  if (key === 'default') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', key);
  }
  try { localStorage.setItem('tf-theme', key); } catch {}
}

export function TweaksPanel({ open, onClose }: TweaksPanelProps) {
  const [active, setActive] = useState<ThemeKey>('default');

  // Read stored theme on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tf-theme') as ThemeKey | null;
      if (stored) setActive(stored);
    } catch {}
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  function select(key: ThemeKey) {
    setActive(key);
    applyTheme(key);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200 }}
      />
      {/* Panel */}
      <aside
        className="tf-slide-in-right"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 280,
          background: 'var(--bg-2)',
          borderLeft: '1px solid var(--border-strong)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-24px 0 48px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Tweaks</div>
            <div style={{ fontSize: 11, color: 'var(--text-1)', marginTop: 2 }}>Appearance & preferences</div>
          </div>
          <button type="button" className="tf-btn tf-btn-ghost tf-btn-icon" onClick={onClose} aria-label="Close tweaks">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Theme section */}
          <div style={{ marginBottom: 24 }}>
            <div className="tf-label" style={{ marginBottom: 12 }}>Theme</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {THEMES.map((theme) => (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => select(theme.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${active === theme.key ? 'var(--accent-strong)' : 'var(--border)'}`,
                    background: active === theme.key ? 'var(--accent-glow)' : 'var(--bg-3)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    width: '100%',
                  }}
                >
                  {/* Swatch */}
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: theme.swatch,
                      border: '1px solid var(--border-strong)',
                      flexShrink: 0,
                      boxShadow: active === theme.key ? `0 0 12px ${theme.swatch}80` : 'none',
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)' }}>{theme.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-1)', marginTop: 1 }}>{theme.sub}</div>
                  </span>
                  {active === theme.key && (
                    <Check size={14} style={{ color: 'var(--accent-2)', flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="tf-divider" />

          <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.55 }}>
            Theme preference is saved locally and applied without a flash on every page load.
          </div>
        </div>
      </aside>
    </>
  );
}
