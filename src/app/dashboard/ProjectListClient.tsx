'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createProject, archiveProject } from '@/lib/services/project.service';
import { ProjectForm } from '@/components/project/ProjectForm';
import type { Project } from '@/lib/supabase/types';
import * as I from '@/components/ui/Icons';

interface Props {
  initialProjects: Project[];
}

export function ProjectListClient({ initialProjects }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleCreate(input: Parameters<typeof createProject>[0]) {
    setCreating(true);
    try {
      const project = await createProject(input);
      setProjects((prev) => [project, ...prev]);
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function handleArchive(id: string) {
    if (!confirm('Archive this project? You can restore it later.')) return;
    await archiveProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="tf-fade-in">
      {/* Header */}
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <span className="tf-pill">✦ Projects</span>
            All Projects
          </div>
          <div className="tf-page-sub">
            {projects.length} active project{projects.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button className="tf-btn tf-btn-primary" onClick={() => setShowForm(true)}>
          <I.Plus size={14} /> New project
        </button>
      </div>

      {/* Project grid */}
      {projects.length === 0 ? (
        <EmptyState onNew={() => setShowForm(true)} />
      ) : (
        <div className="tf-grid-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onArchive={handleArchive} />
          ))}
        </div>
      )}

      {/* New project modal */}
      {showForm && (
        <ProjectForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          loading={creating}
        />
      )}
    </div>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({ project, onArchive }: { project: Project; onArchive: (id: string) => void }) {
  const snap = project.manifest_snapshot ?? {};
  const tcCount = snap.test_suite?.tc_count ?? 0;
  const uxScore = snap.ux_review?.overall_score;
  const gapsCount = snap.gap_analysis?.gaps_count ?? 0;
  const initials = project.name.slice(0, 2).toUpperCase();

  return (
    <div className="tf-card tf-project-card">
      <div className="tf-card-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="tf-proj-icon" style={{ width: 36, height: 36, fontSize: 13 }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 1 }}>{project.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-1)' }}>
              {[project.app_type, project.platform].filter(Boolean).join(' · ') || 'Project'}
            </div>
          </div>
        </div>
        <button
          className="tf-btn tf-btn-icon tf-btn-ghost"
          title="Archive"
          onClick={() => onArchive(project.id)}
        >
          <I.More size={14} />
        </button>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-1)', margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {project.description}
      </p>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <Stat icon={<I.TestCases size={12} />} value={tcCount} label="tests" />
        <Stat icon={<I.UX size={12} />} value={uxScore ? `${uxScore}%` : '—'} label="UX" />
        <Stat icon={<I.Gap size={12} />} value={gapsCount} label="gaps" />
      </div>

      <Link href={`/dashboard/${project.id}`} className="tf-btn tf-btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
        Open project
      </Link>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-1)' }}>
      {icon}
      <span style={{ fontWeight: 600, color: 'var(--text-0)' }}>{value}</span>
      <span>{label}</span>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center', gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--accent-glow)', border: '1px solid var(--accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-2)' }}>
        <I.Sparkle size={28} />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>No projects yet</div>
        <div style={{ color: 'var(--text-1)', fontSize: 13 }}>Create your first project to start generating test artifacts.</div>
      </div>
      <button className="tf-btn tf-btn-primary" onClick={onNew}>
        <I.Plus size={14} /> New project
      </button>
    </div>
  );
}
