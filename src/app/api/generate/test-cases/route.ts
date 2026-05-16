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
  getProjectScreenMaps,
  getProjectArtifacts,
} from '@/lib/ai/weaver.service';
import { createAdminClient } from '@/lib/supabase/admin';
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
  let body: { projectId?: string; focusAreas?: string[]; resumeFrom?: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { projectId, focusAreas, resumeFrom } = body;
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
  const { stream, provider, model, estimatedTokens } = await streamTestCases({
    project: project as Project,
    focusAreas,
    artifacts,
    screenMaps,
    userId: user.id,
    allowGoogleFallback: true,
    resumeFrom,
  });

  const encoder = new TextEncoder();
  const send = (obj: unknown) =>
    encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);

  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(send({ type: 'meta', provider, model, estimatedTokens }));

      try {
        // partialObjectStream yields DeepPartial<TestSuiteOutput> on every token
        for await (const partial of stream.partialObjectStream) {
          controller.enqueue(send({ type: 'partial', object: partial }));
        }
        // Final complete object
        const final = await stream.object;
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
