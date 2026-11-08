/**
 * POST /api/generate/test-cases
 *
 * Streams test suite generation via SSE.
 * Body: { projectId, focusAreas?, resumeFrom? }
 *
 * SSE event types:
 *  { type: 'meta',    provider, model, estimatedTokens }
 *  { type: 'partial', object: DeepPartial<TestSuiteOutput> }
 *  { type: 'done',    object: TestSuiteOutput }
 *  { type: 'error',   message: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  streamTestCases,
  runJudge,
  getProjectScreenMaps,
  getProjectArtifacts,
} from '@/lib/ai/weaver.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { PROMPT_VERSION } from '@/lib/ai/prompt-version';
import type { Project } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min ceiling

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const authClient = createServerClient(
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

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { projectId?: string; focusAreas?: string[]; resumeFrom?: number; role?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { projectId, focusAreas, resumeFrom, role } = body;
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  // ── Project ownership ─────────────────────────────────────────────────────
  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from('projects').select('*')
    .eq('id', projectId).eq('user_id', user.id).eq('status', 'active')
    .maybeSingle();

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // ── Context ───────────────────────────────────────────────────────────────
  const [screenMaps, artifacts] = await Promise.all([
    getProjectScreenMaps(projectId),
    getProjectArtifacts(projectId),
  ]);

  // No screenshots: allowed per spec — generate from description only with a warning note.
  // The generator prompt already handles absent ScreenElementMaps gracefully.

  // ── Stream ────────────────────────────────────────────────────────────────
  const { stream, provider, model, estimatedTokens } = await streamTestCases({
    project: { ...(project as Project), ...(role ? { user_role: role } : {}) } as Project,
    focusAreas,
    artifacts,
    screenMaps,   // may be [] — generator handles this
    userId: user.id,
    allowGoogleFallback: (project as Project).extended_providers_enabled ?? false,
    resumeFrom,
    noScreensWarning: screenMaps.length === 0,
  });

  const encoder = new TextEncoder();
  const send = (obj: unknown) =>
    encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);

  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(send({ type: 'meta', provider, model, estimatedTokens }));

      const startMs = Date.now();
      try {
        // partialObjectStream yields DeepPartial<TestSuiteOutput> on every token
        for await (const partial of stream.partialObjectStream) {
          controller.enqueue(send({ type: 'partial', object: partial }));
        }

        // Final complete object from generator
        const generated = await stream.object as import('@/lib/schemas/test-case').TestSuiteOutput;

        // ── Judge phase ─────────────────────────────────────────────────────
        let final = generated;
        let judged = false;
        try {
          // Respect the project's privacy mode: Google fallback only if the user opted in.
          final = await runJudge(
            generated,
            screenMaps,
            (project as Project).extended_providers_enabled ?? false,
          );
          judged = true;
        } catch (judgeErr) {
          // Judge failure is non-fatal — surface raw generation (saved as unverified)
          console.warn('[Judge] failed, using raw output:', judgeErr);
        }

        // ── Persist to generated_artifacts ──────────────────────────────────
        try {
          // Flip previous test_suite artifacts to non-latest before inserting
          await supabase.from('generated_artifacts')
            .update({ is_latest: false })
            .eq('project_id', projectId)
            .eq('artifact_type', 'test_suite');

          await supabase.from('generated_artifacts').insert({
            project_id:          projectId,
            user_id:             user.id,
            artifact_type:       'test_suite',
            content:             final,
            input_snapshot:      { focus_areas: focusAreas ?? [], resume_from: resumeFrom ?? null },
            model_used:          model,
            provider,
            generation_time_ms:  Date.now() - startMs,
            prompt_version:      PROMPT_VERSION,
            is_verified:         judged,
            is_latest:           true,
            status:              'complete',
          });
        } catch (dbErr) {
          // DB failure is non-fatal — client still gets results
          console.error('[DB] artifact persist failed:', dbErr);
        }

        controller.enqueue(send({ type: 'done', object: final }));
      } catch (err) {
        controller.enqueue(send({
          type: 'error',
          message: err instanceof Error ? err.message : 'Generation failed',
        }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type':    'text/event-stream',
      'Cache-Control':   'no-cache',
      'Connection':      'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
