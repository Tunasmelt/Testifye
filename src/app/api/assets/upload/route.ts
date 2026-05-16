/**
 * POST /api/assets/upload
 *
 * Thin route handler — validates, calls storage, inserts DB record.
 * Max size: 200 KB (compressed WebP at ≤150 KB + form overhead).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

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

  if (!file || !projectId || !sha256 || !pHash) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File exceeds ${MAX_BYTES / 1024} KB limit` }, { status: 413 });
  }

  const supabase = createAdminClient();

  // ── Verify project ownership ──────────────────────────────────────────────
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
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
      perceptual_hash: pHash,
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

  return NextResponse.json({ asset, fromCache: false }, { status: 201 });
}
