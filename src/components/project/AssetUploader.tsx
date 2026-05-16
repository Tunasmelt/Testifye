'use client';

import React, { useCallback, useRef, useState } from 'react';
import { uploadAsset, checkDuplicate } from '@/lib/services/asset.service';
import type { ProjectAsset } from '@/lib/supabase/types';

interface Props {
  projectId:  string;
  userId:     string;
  existing:   ProjectAsset[];
  onUploaded: (asset: ProjectAsset) => void;
  /** Maximum screenshots allowed (soft cap shown as warning, not enforced). */
  maxScreens?: number;
}

type UploadState =
  | { status: 'idle' }
  | { status: 'dragging' }
  | { status: 'uploading'; name: string; pct: number }
  | { status: 'dedup'; message: string; onConfirm: () => void; onCancel: () => void }
  | { status: 'error'; message: string }
  | { status: 'done'; asset: ProjectAsset };

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_RAW_MB = 25;

export function AssetUploader({ projectId, userId, existing, onUploaded, maxScreens = 20 }: Props) {
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => setState({ status: 'idle' });

  const processFile = useCallback(async (file: File, skipDedupCheck = false) => {
    // Validate type
    if (!ACCEPTED.includes(file.type)) {
      setState({ status: 'error', message: `Unsupported file type: ${file.type}. Use PNG, JPEG, or WebP.` });
      return;
    }

    // Validate raw size
    if (file.size > MAX_RAW_MB * 1024 * 1024) {
      setState({ status: 'error', message: `File exceeds ${MAX_RAW_MB} MB. Please export a smaller screenshot.` });
      return;
    }

    setState({ status: 'uploading', name: file.name, pct: 0 });

    try {
      const result = await uploadAsset({
        projectId,
        userId,
        file,
        onProgress: (pct) => {
          if (pct < 100) setState({ status: 'uploading', name: file.name, pct });
        },
      });

      // Dedup check (skip if user confirmed)
      if (!skipDedupCheck) {
        const dedup = checkDuplicate(result.sha256, result.pHash, existing);

        if (dedup.isDuplicate && dedup.exactMatch) {
          setState({
            status: 'error',
            message: `This screenshot already exists as "${dedup.exactMatch.file_name}".`,
          });
          return;
        }

        if (dedup.similarMatch) {
          const { asset: sim, distance } = dedup.similarMatch;
          setState({
            status: 'dedup',
            message: `This looks similar to "${sim.file_name}" (similarity ${Math.round((1 - distance / 64) * 100)}%). Upload anyway?`,
            onConfirm: () => processFile(file, true),
            onCancel: reset,
          });
          return;
        }
      }

      setState({ status: 'done', asset: result.asset });
      onUploaded(result.asset);

      // Auto-reset after brief success flash
      setTimeout(reset, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setState({ status: 'error', message: msg });
    }
  }, [projectId, userId, existing, onUploaded]);

  // Drag handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setState((s) => s.status === 'uploading' ? s : { status: 'dragging' });
  };
  const onDragLeave = () => setState((s) => s.status === 'dragging' ? { status: 'idle' } : s);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = ''; // allow re-selecting same file
  };

  const isDragging = state.status === 'dragging';
  const isUploading = state.status === 'uploading';
  const isDedup = state.status === 'dedup';
  const isError = state.status === 'error';
  const isDone = state.status === 'done';

  return (
    <div className="tf-uploader">
      {/* Drop zone */}
      <div
        className={`tf-uploader__zone${isDragging ? ' tf-uploader__zone--drag' : ''}${isUploading ? ' tf-uploader__zone--loading' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !isUploading && inputRef.current?.click()}
        aria-label="Upload screenshot"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          style={{ display: 'none' }}
          onChange={onFileChange}
        />

        {isUploading ? (
          <UploadingState name={state.name} pct={state.pct} />
        ) : isDone ? (
          <DoneState name={state.asset.file_name} />
        ) : (
          <IdleState count={existing.length} max={maxScreens} />
        )}
      </div>

      {/* Dedup confirmation */}
      {isDedup && (
        <div className="tf-uploader__dedup">
          <span className="tf-uploader__dedup-msg">{state.message}</span>
          <div className="tf-row" style={{ gap: 8, marginTop: 8 }}>
            <button className="tf-btn tf-btn-sm" onClick={state.onConfirm}>Upload anyway</button>
            <button className="tf-btn tf-btn-sm tf-btn-ghost" onClick={state.onCancel}>Cancel</button>
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="tf-uploader__error">
          <span>{state.message}</span>
          <button className="tf-btn tf-btn-sm tf-btn-ghost" onClick={reset} style={{ marginLeft: 8 }}>Dismiss</button>
        </div>
      )}
    </div>
  );
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function IdleState({ count, max }: { count: number; max: number }) {
  const atCap = count >= max;
  return (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 8 }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <p className="tf-uploader__label">
        {atCap
          ? `${count}/${max} screens — remove one to add more`
          : 'Drop a screenshot here or click to browse'}
      </p>
      <p className="tf-uploader__hint">PNG · JPEG · WebP · up to {MAX_RAW_MB} MB · auto-compressed to ≤150 KB</p>
    </>
  );
}

function UploadingState({ name, pct }: { name: string; pct: number }) {
  return (
    <>
      <p className="tf-uploader__label" style={{ marginBottom: 10 }}>Uploading {name}…</p>
      <div className="tf-uploader__bar-track">
        <div className="tf-uploader__bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="tf-uploader__hint">{pct}%</p>
    </>
  );
}

function DoneState({ name }: { name: string }) {
  return (
    <>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 6 }}>
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <p className="tf-uploader__label" style={{ color: 'var(--accent)' }}>{name} uploaded</p>
    </>
  );
}
