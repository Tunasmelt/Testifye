'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AssetUploader } from '@/components/project/AssetUploader';
import { ScreenThumbnail } from '@/components/project/ScreenThumbnail';
import { NAV_ITEMS } from '@/components/layout/Sidebar';
import type { Project, ProjectAsset, GeneratedArtifact } from '@/lib/supabase/types';
import * as I from '@/components/ui/Icons';

interface Props {
  project:   Project;
  assets:    ProjectAsset[];
  artifacts: Pick<GeneratedArtifact, 'id' | 'artifact_type' | 'model_used' | 'provider' | 'created_at' | 'status'>[];
  userId:    string;
}

export function OverviewClient({ project, assets: initialAssets, artifacts, userId }: Props) {
  const [assets, setAssets] = useState<ProjectAsset[]>(initialAssets);
  const [showUploader, setShowUploader] = useState(false);
  const [editingContext, setEditingContext] = useState(false);
  const [descDraft, setDescDraft]     = useState(project.description ?? '');
  const [scopeDraft, setScopeDraft]   = useState(project.scope ?? '');
  const [savingContext, setSavingContext] = useState(false);
  const [contextError, setContextError]  = useState<string | null>(null);

  const dirtyCount = assets.filter((a) => a.is_dirty).length;

  // Re-sync draft fields if the project prop is refreshed by the server (e.g. after revalidation)
  useEffect(() => {
    if (!editingContext) {
      setDescDraft(project.description ?? '');
      setScopeDraft(project.scope ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.description, project.scope]);

  async function saveContext() {
    setSavingContext(true);
    setContextError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/settings`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ description: descDraft, scope: scopeDraft }),
      });
      if (res.ok) {
        const data = await res.json() as { contextChanged?: boolean };
        if (data.contextChanged) {
          setAssets((prev) => prev.map((a) => ({ ...a, is_dirty: true })));
        }
        setEditingContext(false);
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setContextError(err.error ?? 'Failed to save. Please try again.');
      }
    } catch {
      setContextError('Network error. Please try again.');
    } finally {
      setSavingContext(false);
    }
  }
  const [extProviders, setExtProviders] = useState(project.extended_providers_enabled ?? false);
  const [togglingExt, setTogglingExt]  = useState(false);

  async function toggleExtProviders(val: boolean) {
    setExtProviders(val); // optimistic
    setTogglingExt(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/settings`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ extended_providers_enabled: val }),
      });
      if (!res.ok) setExtProviders(!val); // revert on error
    } catch {
      setExtProviders(!val); // revert on network failure
    } finally {
      setTogglingExt(false);
    }
  }

  const snap = project.manifest_snapshot ?? {};
  const tcCount     = snap.test_suite?.tc_count ?? 0;
  const uxScore     = snap.ux_review?.overall_score;
  const gapsCount   = snap.gap_analysis?.gaps_count ?? 0;
  const screenCount = assets.length;

  const stats = [
    { label: 'Test cases',     value: tcCount,               delta: tcCount > 0 ? 'generated' : 'none yet',     Icon: I.TestCases },
    { label: 'UX score',       value: uxScore ? `${uxScore}%` : '—', delta: uxScore ? 'last audit' : 'not run', Icon: I.UX },
    { label: 'Coverage gaps',  value: gapsCount,             delta: gapsCount > 0 ? 'open' : 'none found',      Icon: I.Gap },
    { label: 'Screens',        value: screenCount,           delta: `${assets.filter(a => a.is_verified).length} analyzed`, Icon: I.Image },
  ];

  const baseHref = `/dashboard/${project.id}`;

  function relativeTime(isoStr: string | null | undefined) {
    if (!isoStr) return 'never';
    const ts = new Date(isoStr).getTime();
    if (!Number.isFinite(ts)) return 'unknown';
    const diff = Date.now() - ts;
    if (diff < 0)          return 'just now';
    if (diff < 60_000)     return 'just now';
    if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  }

  return (
    <div className="tf-fade-in">
      {/* Page header */}
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <span className="tf-pill">✦ Project Brain</span>
            {project.name}
          </div>
          <div className="tf-page-sub">
            {[project.description, project.app_type, project.platform].filter(Boolean).join(' · ')}
            {snap.last_generation_at && ` · Last analyzed ${relativeTime(snap.last_generation_at)}`}
          </div>
        </div>
        <div className="tf-row">
          <button className="tf-btn tf-btn-ghost" onClick={() => setEditingContext((v) => !v)}>
            <I.Alert size={13} /> Edit context
          </button>
          <button className="tf-btn" onClick={() => setShowUploader((v) => !v)}>
            <I.Upload size={14} /> Add screenshot
          </button>
          <Link href={`${baseHref}/test-cases`} className="tf-btn tf-btn-primary" style={{ textDecoration: 'none' }}>
            <I.Sparkle size={14} /> Generate
          </Link>
        </div>
      </div>

      {/* Dirty context banner */}
      {dirtyCount > 0 && !editingContext && (
        <div
          className="tf-card tf-fade-in"
          style={{ marginBottom: 16, padding: '10px 14px', borderColor: 'var(--accent)', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, boxShadow: '0 0 6px var(--accent)', animation: 'tf-pulse-violet 1.8s ease-in-out infinite' }} />
          <div style={{ flex: 1, fontSize: 13 }}>
            <strong>Context changed.</strong> {dirtyCount} screen{dirtyCount > 1 ? 's' : ''} may need re-analysis with your updated description.
          </div>
          <Link href={`${baseHref}/test-cases`} className="tf-btn tf-btn-primary" style={{ textDecoration: 'none', fontSize: 12 }}>
            Re-analyze
          </Link>
        </div>
      )}

      {/* Inline context editor */}
      {editingContext && (
        <div className="tf-card tf-fade-in" style={{ marginBottom: 16, padding: 16 }}>
          <div className="tf-card-head" style={{ marginBottom: 12 }}>
            <div className="tf-card-title"><I.Alert size={14} /> Edit Project Context</div>
            <span className="tf-card-sub">Changing description or scope will mark all screens for re-analysis.</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="tf-label" style={{ marginBottom: 4 }}>Description</div>
              <textarea
                className="tf-input"
                rows={3}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
              />
            </div>
            <div>
              <div className="tf-label" style={{ marginBottom: 4 }}>Scope / Focus</div>
              <textarea
                className="tf-input"
                rows={3}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
                value={scopeDraft}
                onChange={(e) => setScopeDraft(e.target.value)}
              />
            </div>
            {contextError && (
              <div style={{ fontSize: 12, color: 'var(--error)', padding: '6px 10px', background: 'rgba(248,113,113,0.08)', borderRadius: 6 }}>
                {contextError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="tf-btn tf-btn-ghost" onClick={() => { setEditingContext(false); setContextError(null); }}>Cancel</button>
              <button className="tf-btn tf-btn-primary" onClick={saveContext} disabled={savingContext}>
                {savingContext ? 'Saving…' : 'Save & mark dirty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline uploader */}
      {showUploader && (
        <div style={{ marginBottom: 20 }}>
          <AssetUploader
            projectId={project.id}
            userId={userId}
            existing={assets}
            onUploaded={(asset) => setAssets((prev) => [...prev, asset])}
          />
        </div>
      )}

      {/* Stats row */}
      <div className="tf-grid-4" style={{ marginBottom: 20 }}>
        {stats.map((s) => (
          <div key={s.label} className="tf-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="tf-stat-label">{s.label}</div>
              <s.Icon size={14} style={{ color: 'var(--accent-2)' }} />
            </div>
            <div className="tf-stat" style={{ marginTop: 6 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-1)', marginTop: 2 }}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Screens + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Screen grid */}
        <div className="tf-card">
          <div className="tf-card-head">
            <div className="tf-card-title">
              <I.Layers size={14} /> Analyzed Screens
              <span className="tf-badge tf-badge-violet">{assets.length}</span>
            </div>
            <button className="tf-btn tf-btn-sm tf-btn-ghost" onClick={() => setShowUploader(true)}>
              <I.Plus size={12} /> Add
            </button>
          </div>

          {assets.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-1)', fontSize: 12 }}>
              No screenshots yet — add some to start generating.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
              {assets.map((asset) => (
                <ScreenThumbnail key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="tf-card">
          <div className="tf-card-head">
            <div className="tf-card-title"><I.Zap size={14} /> Recent Activity</div>
          </div>
          {artifacts.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-1)', padding: '8px 0' }}>No activity yet.</div>
          ) : (
            <div className="tf-col" style={{ gap: 10 }}>
              {artifacts.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', gap: 10, paddingBottom: 10, borderBottom: i < artifacts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginTop: 6, flexShrink: 0, boxShadow: '0 0 8px var(--accent)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{artifactLabel(a.artifact_type)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {a.model_used} · {a.provider}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-2)' }}>{relativeTime(a.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feature shortcuts */}
      {/* Project Settings */}
      <div className="tf-card" style={{ marginBottom: 16 }}>
        <div className="tf-card-head">
          <div className="tf-card-title"><I.Alert size={14} /> Project Settings</div>
        </div>
        <div style={{ padding: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '10px 0' }}>
            <label className="tf-toggle" style={{ flexShrink: 0, opacity: togglingExt ? 0.6 : 1 }}>
              <input
                type="checkbox"
                checked={extProviders}
                disabled={togglingExt}
                onChange={(e) => toggleExtProviders(e.target.checked)}
              />
              <span className="tf-toggle-slider" />
            </label>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Extended AI Providers</div>
              <div style={{ fontSize: 12, color: 'var(--text-1)', marginTop: 2, maxWidth: 480 }}>
                Allow Google AI Studio as a fallback when GROQ rate-limits. Disable to keep all AI processing GROQ-only (no data sent to Google).
              </div>
              {extProviders && (
                <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4 }}>
                  ⚠ Your project data may be sent to Google AI Studio on rate-limit fallback.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="tf-card">
        <div className="tf-card-head">
          <div className="tf-card-title"><I.Sparkle size={14} /> Jump into a feature</div>
          <span className="tf-card-sub">10 modules · GROQ multi-stage pipeline</span>
        </div>
        <div className="tf-grid-4" style={{ gap: 10 }}>
          {NAV_ITEMS.slice(1).map(({ id, label, Icon, href }) => (
            <Link
              key={id}
              href={`${baseHref}/${href}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
                padding: 14, background: 'var(--bg-1)', border: '1px solid var(--border)',
                borderRadius: 12, color: 'var(--text-0)', textDecoration: 'none', transition: 'all 0.15s',
              }}
              className="tf-feature-card"
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-2)' }}>
                <Icon size={16} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function artifactLabel(type: string): string {
  const map: Record<string, string> = {
    test_suite:      'Generated test cases',
    ux_review:       'UX audit complete',
    bug_report:      'Bug report ready',
    gap_analysis:    'Gap analysis done',
    semantic_link:   'Semantic links mapped',
    vision_map:      'Screen analyzed',
    persona_friction: 'Persona friction mapped',
    i18n_audit:      'i18n audit done',
  };
  return map[type] ?? type;
}
