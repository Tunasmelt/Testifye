/**
 * POST /api/generate/estimate
 * Returns a token budget estimate before generation starts.
 * Body: { projectId, featureType: 'test_suite' | 'ux_review' }
 * Returns: { estimatedTokens: number, hasScreens: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProjectScreenMaps, getProjectArtifacts } from '@/lib/ai/weaver.service';
import { buildFullContext } from '@/lib/ai/context-budget';
import { buildGeneratorPrompt } from '@/lib/ai/prompts/generator';
import { UX_AUDITOR_SYSTEM_PROMPT } from '@/lib/ai/prompts/ux-auditor';
import type { Project } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

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

  let body: { projectId?: string; featureType?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { projectId, featureType = 'test_suite' } = body;
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const VALID_FEATURE_TYPES = ['test_suite', 'ux_review'] as const;
  type FeatureType = typeof VALID_FEATURE_TYPES[number];
  if (!VALID_FEATURE_TYPES.includes(featureType as FeatureType)) {
    return NextResponse.json(
      { error: `featureType must be one of: ${VALID_FEATURE_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from('projects').select('*').eq('id', projectId).eq('user_id', user.id).eq('status', 'active').maybeSingle();
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const [screenMaps, artifacts] = await Promise.all([
    getProjectScreenMaps(projectId),
    getProjectArtifacts(projectId),
  ]);

  const hasScreens = screenMaps.length > 0;

  // If no screens, return 0 — caller can hide the estimate until screens are uploaded
  if (!hasScreens) {
    return NextResponse.json({ estimatedTokens: 0, hasScreens: false });
  }

  const isUX = featureType === 'ux_review';
  const p = project as Project;
  const systemPrompt = isUX
    ? UX_AUDITOR_SYSTEM_PROMPT
    : buildGeneratorPrompt('test cases', p.user_role ?? 'manual_tester');

  const ctx = await buildFullContext({
    project: p,
    screenMaps,
    artifacts,
    featureType: featureType as 'test_suite' | 'ux_review',
    systemPrompt,
    userMessage: 'Cover all relevant areas.',
  });

  return NextResponse.json({ estimatedTokens: ctx.estimatedTokens, hasScreens: true });
}
