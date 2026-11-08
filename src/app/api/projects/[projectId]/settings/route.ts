/**
 * PATCH /api/projects/[projectId]/settings
 * Body: { extended_providers_enabled?: boolean, description?: string, scope?: string }
 * Updates user-controlled project settings.
 * If description or scope actually changes, marks all project_assets as dirty.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

type Params = { params: Promise<{ projectId: string }> };

const SETTINGS_FIELDS   = ['extended_providers_enabled'] as const;
const CONTEXT_FIELDS    = ['description', 'scope'] as const;
const ALL_FIELDS        = [...SETTINGS_FIELDS, ...CONTEXT_FIELDS] as const;
type AllowedField = typeof ALL_FIELDS[number];

export async function PATCH(req: NextRequest, { params }: Params) {
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId } = await params;

  let body: Partial<Record<AllowedField, unknown>>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // Whitelist
  const patch: Partial<Record<AllowedField, unknown>> = {};
  for (const key of ALL_FIELDS) {
    if (key in body) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const supabase = createAdminClient();
  let actuallyChanged = false;

  // Check if context fields are changing (need to dirty assets)
  const contextFieldsInPatch = CONTEXT_FIELDS.some((f) => f in patch);
  if (contextFieldsInPatch) {
    // Verify ownership AND fetch current values in one query
    const { data: current } = await supabase
      .from('projects')
      .select('description, scope')
      .eq('id', projectId)
      .eq('user_id', user.id)        // ownership check
      .eq('status', 'active')
      .maybeSingle();

    if (!current) {
      // Project not found or not owned by this user — stop here
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    actuallyChanged = CONTEXT_FIELDS.some(
      (f) => f in patch && patch[f] !== (current as Record<string, unknown>)[f],
    );

    if (actuallyChanged) {
      // Mark all assets dirty — scoped to both project_id and user_id for safety
      await supabase
        .from('project_assets')
        .update({ is_dirty: true })
        .eq('project_id', projectId)
        .eq('user_id', user.id);
    }
  }

  const { error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (error) {
    console.error('[project settings] update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }

  // contextChanged is true only when values actually differed
  return NextResponse.json({ ok: true, contextChanged: actuallyChanged });
}
