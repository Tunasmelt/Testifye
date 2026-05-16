/**
 * POST /api/generate/chat
 * Sidekick Chat — project-scoped conversational QA assistant.
 * Streams text via SSE.
 * Body: { projectId, messages: [{role, content}][] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { streamText } from 'ai';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProjectArtifacts, getProjectScreenMaps } from '@/lib/ai/weaver.service';
import { getModel } from '@/lib/ai/providers';
import type { Project } from '@/lib/supabase/types';

export const runtime   = 'nodejs';
export const maxDuration = 60;

const SIDEKICK_SYSTEM = (project: Project, screenCount: number, tcCount: number): string => `
You are Tesifye Sidekick, a project-scoped QA assistant.

Project: "${project.name}"
Description: ${project.description}
App type: ${project.app_type ?? 'unknown'} · Platform: ${project.platform ?? 'unknown'}
Tester role: ${project.user_role ?? 'manual_tester'}
Analyzed screens: ${screenCount}
Generated test cases: ${tcCount}

Your job: answer QA-focused questions about this project. Be concise (2–4 short paragraphs).
Reply in markdown. Do NOT be generic — reference the actual project context above.
If you don't know something, say so briefly.
`.trim();

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

  let body: { projectId?: string; messages?: { role: 'user' | 'assistant'; content: string }[] };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { projectId, messages = [] } = body;
  if (!projectId || messages.length === 0) {
    return NextResponse.json({ error: 'projectId and messages required' }, { status: 400 });
  }

  // ── Verify project ────────────────────────────────────────────────────────
  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from('projects').select('*')
    .eq('id', projectId).eq('user_id', user.id).eq('status', 'active')
    .maybeSingle();

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // ── Build context ─────────────────────────────────────────────────────────
  const [screenMaps, artifacts] = await Promise.all([
    getProjectScreenMaps(projectId),
    getProjectArtifacts(projectId),
  ]);

  const tcCount = artifacts.find((a) => a.artifact_type === 'test_suite')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?.content ? (artifacts.find((a) => a.artifact_type === 'test_suite')?.content as any)?.total_count ?? 0 : 0;

  const model  = getModel('reasoning_large', false);
  const system = SIDEKICK_SYSTEM(project as Project, screenMaps.length, tcCount);

  // ── Stream response ───────────────────────────────────────────────────────
  const result = streamText({
    model,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    maxOutputTokens: 800,
    temperature: 0.5,
  });

  // Pipe as SSE
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: chunk })}\n\n`)
          );
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        );
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: (err as Error).message })}\n\n`)
        );
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
