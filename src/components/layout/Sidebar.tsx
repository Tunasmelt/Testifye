'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/lib/supabase/types';
import * as I from '@/components/ui/Icons';

// ── Nav structure ─────────────────────────────────────────────────────────────

export const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',         Icon: I.Home,      href: '' },
  { id: 'test-gen',  label: 'Test Cases',       Icon: I.TestCases, href: 'test-cases' },
  { id: 'ux',        label: 'UX Audit',         Icon: I.UX,        href: 'ux-audit' },
  { id: 'bugs',      label: 'Bug Reports',      Icon: I.Bug,       href: 'bug-reports' },
  { id: 'gaps',      label: 'Gap Finder',       Icon: I.Gap,       href: 'gap-analysis' },
  { id: 'link',      label: 'Semantic Link',    Icon: I.Link,      href: 'semantic-link' },
  { id: 'data',      label: 'Test Data',        Icon: I.Data,      href: 'test-data' },
  { id: 'persona',   label: 'Persona Friction', Icon: I.Persona,   href: 'persona-friction' },
  { id: 'i18n',      label: 'i18n Audit',       Icon: I.Globe,     href: 'i18n-audit' },
  { id: 'launch',    label: 'Launch Readiness', Icon: I.Rocket,    href: 'launch-readiness' },
  { id: 'export',    label: 'Export',           Icon: I.Export,    href: 'export' },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  project:   Project | null;
  userEmail: string;
  userPlan:  string;
}

export function Sidebar({ project, userEmail, userPlan }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const initials = (userEmail ?? 'U').slice(0, 2).toUpperCase();
  const baseHref = project ? `/dashboard/${project.id}` : '/dashboard';

  // Derive active segment from pathname
  const segment = pathname.split('/').at(-1) ?? '';

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="tf-sidebar">
      {/* Logo */}
      <div className="tf-logo">
        <div className="tf-logo-mark"><I.Logo size={28} /></div>
        <div className="tf-logo-text">Tesi<span>fye</span></div>
        <div style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }}>v1</div>
      </div>

      {/* Project switcher */}
      <Link href="/dashboard" className="tf-project-switcher" style={{ textDecoration: 'none' }}>
        <div className="tf-proj-icon">
          {project ? project.name.slice(0, 2).toUpperCase() : '＋'}
        </div>
        <div className="tf-proj-meta">
          <div className="tf-proj-name">{project?.name ?? 'Select project'}</div>
          <div className="tf-proj-sub">
            {project
              ? [project.app_type, project.platform].filter(Boolean).join(' · ') || 'Project'
              : 'All projects'}
          </div>
        </div>
        <I.ChevronDown size={14} />
      </Link>

      {/* Main nav */}
      <div className="tf-nav-section">Workspace</div>
      <nav className="tf-nav">
        {NAV_ITEMS.map(({ id, label, Icon, href }) => {
          const fullHref = href ? `${baseHref}/${href}` : baseHref;
          const isActive = href
            ? pathname.includes(`/${href}`)
            : segment === project?.id || pathname === baseHref;

          return (
            <Link
              key={id}
              href={project ? fullHref : '#'}
              className={`tf-nav-item${isActive ? ' active' : ''}${!project ? ' tf-nav-item--disabled' : ''}`}
              style={{ textDecoration: 'none' }}
              aria-disabled={!project}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Tools section */}
      <div className="tf-nav-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>Tools</div>
      <nav className="tf-nav" style={{ flex: 'none' }}>
        <Link
          href={project ? `${baseHref}/sidekick` : '#'}
          className={`tf-nav-item${pathname.includes('/sidekick') ? ' active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <I.Chat size={15} />
          <span>Sidekick Chat</span>
          <span className="tf-nav-badge" style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--success)' }}>●</span>
        </Link>
        {/* Settings — Phase 2 feature, disabled until page exists */}
        <span
          className="tf-nav-item tf-nav-item--disabled"
          title="Settings — coming in Phase 2"
          style={{ cursor: 'not-allowed', opacity: 0.45 }}
        >
          <I.Settings size={15} />
          <span>Settings</span>
        </span>
      </nav>

      {/* Footer */}
      <div className="tf-sidebar-footer">
        <div className="tf-avatar">{initials}</div>
        <div className="tf-user-meta">
          <div className="tf-user-name">{userEmail}</div>
          <div className="tf-user-plan">{userPlan} · GROQ</div>
        </div>
        <button
          className="tf-btn tf-btn-icon tf-btn-ghost"
          title="Sign out"
          onClick={handleSignOut}
        >
          <I.More size={14} />
        </button>
      </div>
    </aside>
  );
}
