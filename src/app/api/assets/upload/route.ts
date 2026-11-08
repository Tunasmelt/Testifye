/**
 * POST /api/assets/upload
 *
 * Thin route handler — validates, calls storage, inserts DB record.
 * Max size: 200 KB (compressed WebP at ≤150 KB + form overhead).
 */
import { NextRequest, NextResponse, after } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { runScout } from '@/lib/ai/weaver.service';
import type { Project } from '@/lib/supabase/types';

export const runtime = 'nodejs';

const MAX_BYTES = 200 * 1024; // 200 KB

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse FormData ────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file       = formData.get('file')       as File | null;
  const projectId  = formData.get('project_id') as string | null;
  const sha256     = formData.get('sha256')     as string | null;
  const pHash      = formData.get('pHash')      as string | null;
  const origName   = formData.get('original_name') as string | null;
  const label      = (formData.get('label') as string | null) ?? undefined;

  if (!file || !projectId || !sha256) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // pHash may be '' if Canvas/phash is unavailable in the client (non-fatal — skip perceptual dedup)
  const pHashValue = pHash?.trim() || null;

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File exceeds ${MAX_BYTES / 1024} KB limit` }, { status: 413 });
  }

  const supabase = createAdminClient();

  // ── Verify project ownership ──────────────────────────────────────────────
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // ── Exact-hash dedup ──────────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('project_assets')
    .select('*')
    .eq('project_id', projectId)
    .eq('content_hash', sha256)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ asset: existing, fromCache: true });
  }

  // ── Upload to Storage ─────────────────────────────────────────────────────
  const ext = 'webp';
  const storagePath = `${user.id}/${projectId}/${sha256}.${ext}`;

  const buffer = await file.arrayBuffer();
  const { error: storageErr } = await supabase.storage
    .from('project-assets')
    .upload(storagePath, buffer, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (storageErr && storageErr.message !== 'The resource already exists') {
    console.error('[upload] Storage error:', storageErr);
    return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 });
  }

  // ── Insert DB record ──────────────────────────────────────────────────────
  const { data: asset, error: dbErr } = await supabase
    .from('project_assets')
    .insert({
      project_id:      projectId,
      user_id:         user.id,
      asset_type:      'screenshot',
      file_name:       origName ?? file.name,
      storage_path:    storagePath,
      content_hash:    sha256,
      perceptual_hash: pHashValue,
      file_size:       file.size,
      mime_type:       'image/webp',
      metadata:        { label, vision_map_status: 'pending' },
      is_dirty:        true,
      is_verified:     false,
    })
    .select()
    .single();

  if (dbErr) {
    console.error('[upload] DB insert error:', dbErr);
    // Storage already uploaded — leave orphan for cleanup job, return error
    return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
  }

  // ── Shadow Scout: run vision analysis in background after response ────────
  const assetId = asset.id;
  // Use a long-lived signed URL (1 hour) — getPublicUrl won't work on private buckets
  const { data: signedData } = await supabase.storage
    .from('project-assets')
    .createSignedUrl(storagePath, 3600);
  const imageUrl = signedData?.signedUrl ?? '';

  const allowFallback = (project as Project).extended_providers_enabled ?? false;

  after(async () => {
    if (!imageUrl) {
      console.error('[shadow-scout] Could not generate signed URL for asset', assetId);
      return;
    }
    try {
      await runScout({
        projectId,
        userId: user.id,
        assetId,
        imageUrl,
        allowGoogleFallback: allowFallback,
      });
    } catch (err) {
      console.error('[shadow-scout] Failed to analyze asset:', assetId, err);
      // Merge failed status into existing metadata to preserve label/dimensions/etc.
      const admin = createAdminClient();
      const { data: cur } = await admin.from('project_assets').select('metadata').eq('id', assetId).maybeSingle();
      const failedMeta = { ...(cur?.metadata as Record<string, unknown> ?? {}), vision_map_status: 'failed' };
      await admin.from('project_assets').update({ metadata: failedMeta }).eq('id', assetId);
    }
  });

  return NextResponse.json({ asset, fromCache: false }, { status: 201 });
}
