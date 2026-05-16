'use client';

import { useState } from 'react';
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

  function relativeTime(isoStr: string) {
    const diff = Date.now() - new Date(isoStr).getTime();
    if (diff < 60_000)    return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
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
          <button className="tf-btn" onClick={() => setShowUploader((v) => !v)}>
            <I.Upload size={14} /> Add screenshot
          </button>
          <Link href={`${baseHref}/test-cases`} className="tf-btn tf-btn-primary" style={{ textDecoration: 'none' }}>
            <I.Sparkle size={14} /> Generate
          </Link>
        </div>
      </div>

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
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
