/**
 * POST /api/generate/ux-audit
 *
 * Streams UX/UI audit via SSE.
 * Body: { projectId, auditFocus?, screenMetricsSummary? }
 *
 * SSE events:
 *  { type: 'meta',    provider, model, estimatedTokens }
 *  { type: 'partial', object: DeepPartial<UXReviewOutput> }
 *  { type: 'done',    object: UXReviewOutput }
 *  { type: 'error',   message: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  streamUXAudit,
  getProjectScreenMaps,
  getProjectArtifacts,
} from '@/lib/ai/weaver.service';
import { PROMPT_VERSION } from '@/lib/ai/prompt-version';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Project } from '@/lib/supabase/types';
import type { UXReviewOutput } from '@/lib/schemas/ux-review';

export const runtime     = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
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

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { projectId?: string; auditFocus?: string; screenMetricsSummary?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { projectId, auditFocus, screenMetricsSummary } = body;
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

  if (screenMaps.length === 0) {
    return NextResponse.json(
      { error: 'No analyzed screens. Upload and analyze screenshots first.' },
      { status: 422 },
    );
  }

  // ── Stream ────────────────────────────────────────────────────────────────
  const { stream, provider, model, estimatedTokens } = await streamUXAudit({
    project: project as Project,
    screenMaps,
    artifacts,
    userId: user.id,
    auditFocus,
    screenMetricsSummary,
    allowGoogleFallback: (project as Project).extended_providers_enabled ?? false,
  });

  const encoder = new TextEncoder();
  const send    = (obj: unknown) => encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);
  const startMs = Date.now();

  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(send({ type: 'meta', provider, model, estimatedTokens }));

      try {
        for await (const partial of stream.partialObjectStream) {
          controller.enqueue(send({ type: 'partial', object: partial }));
        }

        const final = await stream.object as UXReviewOutput;

        // Persist artifact (flip previous to non-latest first)
        try {
          await supabase.from('generated_artifacts')
            .update({ is_latest: false })
            .eq('project_id', projectId)
            .eq('artifact_type', 'ux_review');

          await supabase.from('generated_artifacts').insert({
            project_id:         projectId,
            user_id:            user.id,
            artifact_type:      'ux_review',
            content:            final,
            input_snapshot:     { audit_focus: auditFocus ?? 'Full Audit' },
            model_used:         model,
            provider,
            generation_time_ms: Date.now() - startMs,
            prompt_version: PROMPT_VERSION,
            is_verified:        false,
            is_latest:          true,
            status:             'complete',
          });
        } catch (dbErr) {
          console.error('[DB] ux_review persist failed:', dbErr);
        }

        controller.enqueue(send({ type: 'done', object: final }));
      } catch (err) {
        controller.enqueue(send({
          type:    'error',
          message: err instanceof Error ? err.message : 'UX audit failed',
        }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
