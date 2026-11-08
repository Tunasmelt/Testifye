/**
 * GET  /api/chat/[projectId] — load messages for this project
 * POST /api/chat/[projectId] — upsert messages (append or replace)
 * DELETE /api/chat/[projectId] — clear messages
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import type { ChatMessage } from '@/lib/supabase/types';

async function getUser() {
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
  return user;
}

type Params = { params: Promise<{ projectId: string }> };

/** The admin client bypasses RLS, so ownership must be checked explicitly. */
async function ownsProject(projectId: string, userId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from('projects').select('id')
    .eq('id', projectId).eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId } = await params;
  if (!(await ownsProject(projectId, user.id))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('chat_sessions')
    .select('messages, updated_at')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  return NextResponse.json({ messages: (data?.messages as ChatMessage[]) ?? [], updatedAt: data?.updated_at ?? null });
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId } = await params;
  if (!(await ownsProject(projectId, user.id))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  let body: { messages?: ChatMessage[] };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // Cap at last 200 messages to prevent unbounded JSONB growth
  const MAX_MESSAGES = 200;
  const raw = body.messages ?? [];
  const messages = raw.length > MAX_MESSAGES ? raw.slice(-MAX_MESSAGES) : raw;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('chat_sessions')
    .upsert(
      { project_id: projectId, user_id: user.id, messages, is_active: true },
      { onConflict: 'project_id,user_id' },
    );

  if (error) {
    console.error('[chat_sessions] upsert error:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId } = await params;
  if (!(await ownsProject(projectId, user.id))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('chat_sessions')
    .upsert(
      { project_id: projectId, user_id: user.id, messages: [], is_active: false },
      { onConflict: 'project_id,user_id' },
    );

  if (error) {
    console.error('[chat_sessions] delete error:', error);
    return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
