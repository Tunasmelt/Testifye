/**
 * GET /api/artifacts/stale?projectId=&artifactType=
 * Returns whether the latest artifact of a given type is stale (prompt version behind current).
 * Used to surface "Re-generate with latest prompts" nudge in the UI.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { isStale } from '@/lib/ai/prompt-version';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId    = searchParams.get('projectId');
  const artifactType = searchParams.get('artifactType');

  if (!projectId || !artifactType) {
    return NextResponse.json({ error: 'projectId and artifactType required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects').select('id').eq('id', projectId).eq('user_id', user.id).eq('status', 'active').maybeSingle();
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // is_latest=true guarantees at most one row per (project_id, artifact_type)
  const { data: artifact } = await supabase
    .from('generated_artifacts')
    .select('prompt_version, created_at')
    .eq('project_id', projectId)
    .eq('artifact_type', artifactType)
    .eq('is_latest', true)
    .maybeSingle();

  if (!artifact) {
    return NextResponse.json({ stale: false, exists: false });
  }

  return NextResponse.json({
    stale:          isStale(artifact.prompt_version),
    exists:         true,
    prompt_version: artifact.prompt_version,
    created_at:     artifact.created_at,
  });
}
