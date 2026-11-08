/**
 * GET /api/assets/signed-url?path=...
 * Returns a short-lived (60 s) signed URL for a private storage object.
 * Verifies asset ownership before issuing URL to prevent IDOR.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
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

  const storagePath = req.nextUrl.searchParams.get('path');
  if (!storagePath) {
    return NextResponse.json({ error: 'Missing path param' }, { status: 400 });
  }

  // Ownership check: storage paths are structured as `{userId}/{projectId}/{hash}.webp`
  // The first segment must be the requesting user's ID.
  const pathUserId = storagePath.split('/')[0];
  if (pathUserId !== user.id) {
    // Secondary check: look up by storage_path in DB to handle edge cases
    const supabase = createAdminClient();
    const { data: asset } = await supabase
      .from('project_assets')
      .select('id')
      .eq('storage_path', storagePath)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!asset) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from('project-assets')
    .createSignedUrl(storagePath, 60); // 60 second TTL

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Could not create signed URL' }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
