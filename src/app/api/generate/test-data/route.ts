/**
 * POST /api/generate/test-data
 * Body: { projectId, projectDescription?, datasetCount? }
 * Returns: { data: TestDataOutput, provider, model }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateTestData } from '@/lib/ai/weaver.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { PROMPT_VERSION } from '@/lib/ai/prompt-version';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
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

  let body: { projectId?: string; projectDescription?: string; datasetCount?: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { projectId, projectDescription, datasetCount = 5 } = body;
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const clampedCount = Math.min(20, Math.max(1, Number(datasetCount) || 5));

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, description, extended_providers_enabled')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const description = projectDescription?.trim() ||
    (project.description as string | null) ||
    (project.name as string) ||
    'Web application';

  const startMs = Date.now();
  let data, provider, model;
  try {
    ({ data, provider, model } = await generateTestData({
      projectId,
      userId: user.id,
      projectDescription: description,
      datasetCount: clampedCount,
      allowGoogleFallback: (project.extended_providers_enabled as boolean) ?? false,
    }));
  } catch (e) {
    console.error('[weaver] test data generation failed:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI generation failed' },
      { status: 502 },
    );
  }

  // Flip previous artifact to non-latest, then insert new one
  await supabase.from('generated_artifacts')
    .update({ is_latest: false })
    .eq('project_id', projectId)
    .eq('artifact_type', 'test_data');

  const { error: dbErr } = await supabase.from('generated_artifacts').insert({
    project_id:         projectId,
    user_id:            user.id,
    artifact_type:      'test_data',
    content:            data,
    input_snapshot:     { description: description.slice(0, 200), dataset_count: clampedCount },
    model_used:         model,
    provider,
    generation_time_ms: Date.now() - startMs,
    prompt_version:     PROMPT_VERSION,
    is_verified:        false,
    is_latest:          true,
    status:             'complete',
  });
  if (dbErr) console.error('[DB] test_data persist:', dbErr);

  return NextResponse.json({ data, provider, model });
}
