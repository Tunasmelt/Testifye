'use client';

import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './Sidebar';
import * as I from '@/components/ui/Icons';

interface TopbarProps {
  projectName?: string;
  /** Current active model string shown in provider badge */
  modelLabel?: string;
}

export function Topbar({ projectName, modelLabel = 'GROQ · llama-4-scout' }: TopbarProps) {
  const pathname = usePathname();

  // Derive breadcrumb label from path
  const segment = pathname.split('/').at(-1) ?? '';
  const navItem = NAV_ITEMS.find((n) => n.href === segment);
  const pageLabel = navItem?.label ?? (segment === '' ? 'Overview' : 'Overview');

  return (
    <div className="tf-topbar">
      {/* Breadcrumb */}
      <div className="tf-breadcrumb">
        <I.Folder size={14} />
        {projectName && (
          <>
            <span>{projectName}</span>
            <span className="tf-breadcrumb-sep">/</span>
          </>
        )}
        <b>{pageLabel}</b>
      </div>

      {/* Search trigger (CommandPalette stub) */}
      <div className="tf-search" role="button" tabIndex={0} aria-label="Quick search">
        <I.Search size={13} />
        <span style={{ flex: 1 }}>Quick search…</span>
        <span className="tf-kbd">⌘K</span>
      </div>

      {/* Provider badge */}
      <span className="tf-provider-badge">
        <span className="tf-dot" />
        {modelLabel}
      </span>

      {/* Refresh (placeholder for future notifications) */}
      <button className="tf-btn tf-btn-icon tf-btn-ghost" title="Refresh">
        <I.Refresh size={14} />
      </button>
    </div>
  );
}
