/**
 * POST /api/generate/launch-readiness
 *
 * Deterministic launch-readiness score (no AI call). Scoring lives in
 * src/lib/services/launch-readiness.service.ts.
 * Body: { projectId }  →  LaunchReadinessOutput
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadAndComputeLaunchReadiness } from '@/lib/services/launch-readiness.service';

export const runtime     = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const authClient  = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      },
    },
  );

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { projectId?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { projectId } = body;
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const { data: project } = await createAdminClient()
    .from('projects').select('id')
    .eq('id', projectId).eq('user_id', user.id).eq('status', 'active')
    .maybeSingle();
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  return NextResponse.json(await loadAndComputeLaunchReadiness(projectId));
}
