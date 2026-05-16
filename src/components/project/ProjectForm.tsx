'use client';

import { useState } from 'react';
import type { CreateProjectInput } from '@/lib/services/project.service';
import type { AppType, UserRole, Platform } from '@/lib/supabase/types';
import * as I from '@/components/ui/Icons';

interface Props {
  onSubmit: (input: CreateProjectInput) => Promise<void>;
  onClose:  () => void;
  loading?: boolean;
  /** Pre-fill for edit mode */
  initial?: Partial<CreateProjectInput>;
  mode?: 'create' | 'edit';
}

const APP_TYPES: { value: AppType; label: string }[] = [
  { value: 'web',        label: 'Web app' },
  { value: 'mobile',     label: 'Mobile app' },
  { value: 'desktop',    label: 'Desktop app' },
  { value: 'responsive', label: 'Responsive' },
  { value: 'pwa',        label: 'PWA' },
];

const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'manual_tester',        label: 'Manual tester' },
  { value: 'automation_engineer',  label: 'Automation engineer' },
  { value: 'qa_lead',              label: 'QA lead' },
  { value: 'product_manager',      label: 'Product manager' },
  { value: 'ux_designer',          label: 'UX designer' },
];

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'web',            label: 'Web' },
  { value: 'ios',            label: 'iOS' },
  { value: 'android',        label: 'Android' },
  { value: 'cross_platform', label: 'Cross-platform' },
];

export function ProjectForm({ onSubmit, onClose, loading, initial, mode = 'create' }: Props) {
  const [form, setForm] = useState<CreateProjectInput>({
    name:            initial?.name ?? '',
    description:     initial?.description ?? '',
    scope:           initial?.scope ?? '',
    target_audience: initial?.target_audience ?? '',
    app_type:        initial?.app_type ?? undefined,
    user_role:       initial?.user_role ?? undefined,
    platform:        initial?.platform ?? undefined,
  });

  const [error, setError] = useState('');

  function set<K extends keyof CreateProjectInput>(key: K, val: CreateProjectInput[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim())        { setError('Project name is required.'); return; }
    if (!form.description.trim()) { setError('Description is required.'); return; }
    setError('');
    try {
      await onSubmit({ ...form, name: form.name.trim(), description: form.description.trim() });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="tf-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tf-modal" style={{ maxWidth: 520 }}>
        {/* Header */}
        <div className="tf-card-head" style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            {mode === 'create' ? 'New project' : 'Edit project'}
          </h2>
          <button className="tf-btn tf-btn-icon tf-btn-ghost" onClick={onClose} aria-label="Close">
            <I.X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="tf-field">
            <label className="tf-label" htmlFor="pf-name">Project name *</label>
            <input
              id="pf-name"
              className="tf-input"
              placeholder="e.g. Pebble Travel App"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              maxLength={80}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="tf-field">
            <label className="tf-label" htmlFor="pf-desc">Description *</label>
            <textarea
              id="pf-desc"
              className="tf-textarea"
              placeholder="What does this app do? Who uses it?"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              maxLength={400}
            />
          </div>

          {/* 3-col select row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="tf-field">
              <label className="tf-label" htmlFor="pf-type">App type</label>
              <select id="pf-type" className="tf-input" value={form.app_type ?? ''} onChange={(e) => set('app_type', (e.target.value as AppType) || undefined)}>
                <option value="">—</option>
                {APP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="tf-field">
              <label className="tf-label" htmlFor="pf-platform">Platform</label>
              <select id="pf-platform" className="tf-input" value={form.platform ?? ''} onChange={(e) => set('platform', (e.target.value as Platform) || undefined)}>
                <option value="">—</option>
                {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="tf-field">
              <label className="tf-label" htmlFor="pf-role">Your role</label>
              <select id="pf-role" className="tf-input" value={form.user_role ?? ''} onChange={(e) => set('user_role', (e.target.value as UserRole) || undefined)}>
                <option value="">—</option>
                {USER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {/* Optional fields */}
          <div className="tf-field">
            <label className="tf-label" htmlFor="pf-scope">Scope (optional)</label>
            <input
              id="pf-scope"
              className="tf-input"
              placeholder="Which flows / screens to focus on"
              value={form.scope ?? ''}
              onChange={(e) => set('scope', e.target.value)}
            />
          </div>
          <div className="tf-field">
            <label className="tf-label" htmlFor="pf-audience">Target audience (optional)</label>
            <input
              id="pf-audience"
              className="tf-input"
              placeholder="e.g. Travel enthusiasts, 25–45, mobile-first"
              value={form.target_audience ?? ''}
              onChange={(e) => set('target_audience', e.target.value)}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>{error}</div>
          )}

          {/* Actions */}
          <div className="tf-row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" className="tf-btn tf-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="tf-btn tf-btn-primary" disabled={loading}>
              {loading ? 'Creating…' : mode === 'create' ? 'Create project' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
