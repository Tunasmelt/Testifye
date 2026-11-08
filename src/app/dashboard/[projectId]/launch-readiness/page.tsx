/**
 * /dashboard/[projectId]/launch-readiness
 * Launch Readiness Score — Phase 4 Task 4.6
 */
import { AppShell } from '@/components/layout/AppShell';
import { LaunchReadinessClient } from './LaunchReadinessClient';

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata() {
  return { title: 'Launch Readiness — Testifye' };
}

export default async function LaunchReadinessPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <AppShell projectId={projectId}>
      <LaunchReadinessClient projectId={projectId} />
    </AppShell>
  );
}
