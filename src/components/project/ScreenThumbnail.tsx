'use client';

import { useState, useEffect, useRef } from 'react';
import { getSignedUrl } from '@/lib/services/asset.service';
import type { ProjectAsset } from '@/lib/supabase/types';
import * as I from '@/components/ui/Icons';

interface Props {
  asset: ProjectAsset;
}

export function ScreenThumbnail({ asset }: Props) {
  const [url, setUrl]           = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [hovered, setHovered]   = useState(false);
  const [editing, setEditing]   = useState(false);
  const [labelDraft, setDraft]  = useState<string>('');
  const [saving, setSaving]     = useState(false);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [saveError,  setSaveError]  = useState(false);
  const inputRef                    = useRef<HTMLInputElement>(null);

  const derivedLabel = asset.metadata?.label ?? asset.file_name.replace(/\.(webp|png|jpe?g)$/i, '');
  const label = savedLabel ?? derivedLabel;
  const verified    = asset.is_verified;
  const dirty       = asset.is_dirty;
  const visionStatus = asset.metadata?.vision_map_status;

  // Reset local label override when a different asset is passed
  useEffect(() => {
    setSavedLabel(null);
    setSaveError(false);
  }, [asset.id]);

  useEffect(() => {
    let cancelled = false;
    getSignedUrl(asset.storage_path)
      .then((u) => { if (!cancelled) { setUrl(u); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [asset.storage_path]);

  useEffect(() => {
    if (editing) {
      setDraft(label);
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus/select the input once it mounts when editing
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  async function saveLabel() {
    const trimmed = labelDraft.trim();
    if (!trimmed || trimmed === label) { setEditing(false); return; }
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ label: trimmed }),
      });
      if (res.ok) {
        setSavedLabel(trimmed);
      } else {
        setSaveError(true);
      }
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); saveLabel(); }
    if (e.key === 'Escape') { setEditing(false); }
  }

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div
        style={{
          width:         '100%',
          aspectRatio:   '9/16',
          borderRadius:  8,
          overflow:      'hidden',
          background:    'var(--bg-1)',
          border:        `1px solid ${dirty ? 'var(--accent)' : 'var(--border)'}`,
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'center',
          transition:    'border-color 0.2s',
        }}
      >
        {loading ? (
          <div className="tf-skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <I.Image size={20} style={{ color: 'var(--text-2)' }} />
        )}
      </div>

      {/* Dirty indicator */}
      {dirty && (
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 10, height: 10, borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 0 2px var(--bg-0), 0 0 8px var(--accent)',
          animation: 'tf-pulse-violet 1.8s ease-in-out infinite',
        }} />
      )}

      {/* Vision status badge */}
      {visionStatus === 'pending' && !verified && (
        <div title="Vision analysis pending" style={{
          position: 'absolute', bottom: 22, right: 4,
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--bg-0)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <I.Alert size={10} style={{ color: 'var(--warning)' }} />
        </div>
      )}
      {visionStatus === 'failed' && !verified && (
        <div title="Vision analysis failed — will retry on next generation" style={{
          position: 'absolute', bottom: 22, right: 4,
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--bg-0)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <I.X size={10} style={{ color: 'var(--error)' }} />
        </div>
      )}
      {verified && (
        <div title="Vision analysis complete" style={{
          position: 'absolute', bottom: 22, right: 4,
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--bg-0)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <I.CheckCircle size={10} style={{ color: 'var(--success)' }} />
        </div>
      )}

      {/* Label — inline editable */}
      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
        {editing ? (
          <input
            ref={inputRef}
            className="tf-input"
            value={labelDraft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveLabel}
            disabled={saving}
            style={{ fontSize: 10, padding: '2px 5px', height: 22, flex: 1 }}
          />
        ) : (
          <>
            <div style={{ fontSize: 10, fontWeight: 600, color: saveError ? 'var(--error)' : 'var(--text-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
              title={saveError ? 'Failed to save label — click to retry' : undefined}
            >
              {saveError ? '⚠ ' : ''}{label}
            </div>
            {hovered && (
              <button
                onClick={() => { setSaveError(false); setEditing(true); }}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}
                title={saveError ? 'Retry label edit' : 'Edit label'}
              >
                <I.Pencil size={9} style={{ color: saveError ? 'var(--error)' : 'var(--text-2)' }} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
