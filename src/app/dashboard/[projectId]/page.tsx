/**
 * /dashboard/[projectId] — Project overview
 * Server component that fetches project + assets, renders OverviewClient.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { OverviewClient } from './OverviewClient';
import type { Project, ProjectAsset, GeneratedArtifact } from '@/lib/supabase/types';

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectId } = await params;
  return { title: `Project — Testifye`, description: `Project ${projectId}` };
}

export default async function ProjectOverviewPage({ params }: Props) {
  const { projectId } = await params;
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

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!project) notFound();

  // Fetch assets
  const { data: assets } = await supabase
    .from('project_assets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  // Fetch recent artifacts for activity feed
  const { data: artifacts } = await supabase
    .from('generated_artifacts')
    .select('id, artifact_type, model_used, provider, created_at, status')
    .eq('project_id', projectId)
    .eq('is_latest', true)
    .order('created_at', { ascending: false })
    .limit(8);

  return (
    <AppShell projectId={projectId}>
      <OverviewClient
        project={project as Project}
        assets={(assets ?? []) as ProjectAsset[]}
        artifacts={(artifacts ?? []) as GeneratedArtifact[]}
        userId={user.id}
      />
    </AppShell>
  );
}
