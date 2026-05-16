'use client';

import { useState, useEffect } from 'react';
import { getSignedUrl } from '@/lib/services/asset.service';
import type { ProjectAsset } from '@/lib/supabase/types';
import * as I from '@/components/ui/Icons';

interface Props {
  asset: ProjectAsset;
}

export function ScreenThumbnail({ asset }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const label = asset.metadata?.label ?? asset.file_name.replace(/\.(webp|png|jpe?g)$/i, '');
  const verified = asset.is_verified;
  const dirty = asset.is_dirty;
  const visionStatus = asset.metadata?.vision_map_status;

  useEffect(() => {
    let cancelled = false;
    getSignedUrl(asset.storage_path)
      .then((u) => { if (!cancelled) { setUrl(u); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [asset.storage_path]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Thumbnail */}
      <div
        style={{
          width: '100%',
          aspectRatio: '9/16',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--bg-1)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
          background: 'var(--warning)',
          boxShadow: '0 0 0 3px var(--bg-0), 0 0 8px var(--warning)',
        }} />
      )}

      {/* Vision status badge */}
      {visionStatus === 'pending' && !verified && (
        <div style={{
          position: 'absolute', bottom: 4, right: 4,
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--bg-0)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <I.Alert size={10} style={{ color: 'var(--warning)' }} />
        </div>
      )}
      {verified && (
        <div style={{
          position: 'absolute', bottom: 4, right: 4,
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--bg-0)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <I.CheckCircle size={10} style={{ color: 'var(--success)' }} />
        </div>
      )}

      {/* Label */}
      <div style={{ fontSize: 10, fontWeight: 600, marginTop: 4, color: 'var(--text-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </div>
    </div>
  );
}
