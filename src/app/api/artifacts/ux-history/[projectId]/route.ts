/**
 * GET /api/artifacts/ux-history/[projectId]
 * Returns up to 20 most-recent ux_review artifact scores for the project.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
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

  const { projectId } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('generated_artifacts')
    .select('id, created_at, content, model_used, provider')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .eq('artifact_type', 'ux_review')
    .eq('status', 'complete')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  // Reverse to chronological order (we fetched DESC to get newest 20)
  const points = (data ?? []).reverse().map((row) => ({
    id:         row.id,
    created_at: row.created_at,
    score:      (row.content as { overall_score?: number })?.overall_score ?? null,
    provider:   row.provider,
    model:      row.model_used,
  })).filter((p): p is typeof p & { score: number } => typeof p.score === 'number');

  return NextResponse.json({ points });
}
