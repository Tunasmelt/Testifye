/**
 * PATCH /api/assets/[assetId]
 * Body: { label?: string }
 * Updates metadata.label on a project_asset.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

type Params = { params: Promise<{ assetId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const cookieStore = await cookies();
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { assetId } = await params;

  let body: { label?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body.label?.trim()) {
    return NextResponse.json({ error: 'label must be a non-empty string' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify ownership by joining via project
  const { data: asset } = await supabase
    .from('project_assets')
    .select('id, metadata')
    .eq('id', assetId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  const updatedMetadata = { ...(asset.metadata as Record<string, unknown> ?? {}), label: body.label.trim() };

  const { error } = await supabase
    .from('project_assets')
    .update({ metadata: updatedMetadata })
    .eq('id', assetId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[asset label] update error:', error);
    return NextResponse.json({ error: 'Failed to update label' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, metadata: updatedMetadata });
}
