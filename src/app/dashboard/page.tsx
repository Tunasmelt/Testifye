/**
 * /dashboard — project list + "New project" CTA
 * Server component: fetches projects and passes them to the client shell.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ProjectListClient } from './ProjectListClient';
import type { Project } from '@/lib/supabase/types';

export const metadata = { title: 'Dashboard — Testifye' };

export default async function DashboardPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('updated_at', { ascending: false });

  return (
    <AppShell>
      <ProjectListClient initialProjects={(projects ?? []) as Project[]} />
    </AppShell>
  );
}
