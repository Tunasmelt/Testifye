/**
 * AppShell — server component that wraps all dashboard pages.
 * Fetches the authed user and active project, then renders the layout grid.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import type { Project, Profile } from '@/lib/supabase/types';

interface AppShellProps {
  children:   React.ReactNode;
  projectId?: string;
}

export async function AppShell({ children, projectId }: AppShellProps) {
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

  // Fetch profile (plan info)
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, display_name')
    .eq('id', user.id)
    .maybeSingle() as { data: Pick<Profile, 'plan' | 'display_name'> | null };

  // Fetch project if projectId provided
  let project: Project | null = null;
  if (projectId) {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    project = data as Project | null;
  }

  const userEmail = profile?.display_name ?? user.email ?? 'User';
  const userPlan  = profile?.plan ?? 'free';

  return (
    <div className="tf-app">
      <Sidebar
        project={project}
        userEmail={userEmail}
        userPlan={userPlan}
      />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <Topbar projectName={project?.name} />
        <main className="tf-content">
          {children}
        </main>
      </div>
    </div>
  );
}
