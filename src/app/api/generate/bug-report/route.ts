/**
 * POST /api/generate/bug-report
 * Body: { projectId, description, bugIndex?, platform?, os?, browser?, appVersion?, component? }
 * Returns: { report: BugReport, provider, model }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateBugReport } from '@/lib/ai/weaver.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { PROMPT_VERSION } from '@/lib/ai/prompt-version';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const authClient  = createServerClient(
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

  let body: {
    projectId?: string; description?: string; bugIndex?: number;
    platform?: string; os?: string; browser?: string; appVersion?: string; component?: string;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { projectId, description, bugIndex, ...ctx } = body;
  if (!projectId || !description?.trim()) {
    return NextResponse.json({ error: 'projectId and description required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from('projects').select('id, extended_providers_enabled').eq('id', projectId).eq('user_id', user.id).eq('status', 'active').maybeSingle();
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const startMs = Date.now();
  const { report, provider, model } = await generateBugReport({
    description,
    bugIndex: bugIndex ?? 1,
    allowGoogleFallback: project.extended_providers_enabled ?? false,
    ...ctx,
  });

  // Flip previous to non-latest, then persist new artifact
  await supabase.from('generated_artifacts')
    .update({ is_latest: false })
    .eq('project_id', projectId)
    .eq('artifact_type', 'bug_report');

  await supabase.from('generated_artifacts').insert({
    project_id: projectId,
    user_id:    user.id,
    artifact_type: 'bug_report',
    content:    report,
    input_snapshot: { description: description.slice(0, 200), context: ctx },
    model_used: model,
    provider,
    generation_time_ms: Date.now() - startMs,
    prompt_version: PROMPT_VERSION,
    is_verified: false,
    is_latest:   true,
    status: 'complete',
  }).then(({ error }) => { if (error) console.error('[DB] bug_report persist:', error); });

  return NextResponse.json({ report, provider, model });
}
