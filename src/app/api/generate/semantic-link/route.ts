/**
 * POST /api/generate/semantic-link
 * Body: multipart/form-data — file (PDF/DOCX/TXT) or text field, projectId
 * Returns: { output: SemanticLinkOutput, provider, model, extractedChars }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateSemanticLink } from '@/lib/ai/weaver.service';
import { extractDocumentText } from '@/lib/services/document.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { PROMPT_VERSION } from '@/lib/ai/prompt-version';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

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

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });

  const projectId = formData.get('projectId') as string | null;
  const file      = formData.get('file') as File | null;
  const rawText   = formData.get('text') as string | null;

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  if (!file && !rawText?.trim()) return NextResponse.json({ error: 'file or text required' }, { status: 400 });

  if (file && file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File too large — maximum 20 MB' }, { status: 413 });
  }

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from('projects')
    .select('id, extended_providers_enabled')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  let prdText      = rawText ?? '';
  let extractedChars = prdText.length;

  if (file) {
    const buffer = await file.arrayBuffer();
    try {
      const extracted = await extractDocumentText(buffer, file.type, file.name);
      prdText        = extracted.text;
      extractedChars = prdText.length;
    } catch (e) {
      console.error('[doc.service] extraction failed:', e);
      return NextResponse.json({ error: 'Failed to extract text from document' }, { status: 422 });
    }
  }

  if (!prdText.trim()) {
    return NextResponse.json({ error: 'No readable text found in document' }, { status: 422 });
  }
  if (prdText.trim().length < 50) {
    return NextResponse.json({ error: 'Document too short — provide at least 50 characters of requirement text' }, { status: 422 });
  }

  const startMs = Date.now();
  let output, provider, model;
  try {
    ({ output, provider, model } = await generateSemanticLink({
      projectId,
      userId: user.id,
      prdText,
      allowGoogleFallback: project.extended_providers_enabled ?? false,
    }));
  } catch (e) {
    console.error('[weaver] semantic link failed:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI generation failed' },
      { status: 502 },
    );
  }

  // Flip previous artifact to non-latest, then insert new one
  await supabase.from('generated_artifacts')
    .update({ is_latest: false })
    .eq('project_id', projectId)
    .eq('artifact_type', 'semantic_link');

  const { error: dbErr } = await supabase.from('generated_artifacts').insert({
    project_id:         projectId,
    user_id:            user.id,
    artifact_type:      'semantic_link',
    content:            output,
    input_snapshot:     { prd_chars: prdText.length, file_name: file?.name ?? 'text_input' },
    model_used:         model,
    provider,
    generation_time_ms: Date.now() - startMs,
    prompt_version:     PROMPT_VERSION,
    is_verified:        false,
    is_latest:          true,
    status:             'complete',
  });
  if (dbErr) console.error('[DB] semantic_link persist:', dbErr);

  return NextResponse.json({ output, provider, model, extractedChars });
}
