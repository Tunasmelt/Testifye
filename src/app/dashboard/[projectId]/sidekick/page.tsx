import { AppShell } from '@/components/layout/AppShell';
import { SidekickChat } from '@/components/sidekick/SidekickChat';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Project } from '@/lib/supabase/types';

interface Props { params: Promise<{ projectId: string }> }

export const metadata = { title: 'Sidekick — Testifye' };

export default async function SidekickPage({ params }: Props) {
  const { projectId } = await params;

  // ── Auth check ──────────────────────────────────────────────────────────────
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
  if (!user) redirect('/login');

  // ── Load project (name only needed on server for initial render) ────────────
  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from('projects').select('id, name')
    .eq('id', projectId).eq('user_id', user.id).eq('status', 'active')
    .maybeSingle();

  const projectName = (project as Pick<Project, 'id' | 'name'> | null)?.name ?? 'your project';

  return (
    <AppShell projectId={projectId}>
      {/* Give the chat panel full remaining height */}
      <div style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
        <SidekickChat projectId={projectId} projectName={projectName} />
      </div>
    </AppShell>
  );
}
