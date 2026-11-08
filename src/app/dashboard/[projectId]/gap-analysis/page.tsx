/**
 * /dashboard/[projectId]/gap-analysis
 * Requirement Gap Finder — Phase 3 Task 3.1
 */
import { AppShell } from '@/components/layout/AppShell';
import { GapAnalysisClient } from './GapAnalysisClient';

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectId } = await params;
  return { title: `Gap Analysis · ${projectId.slice(0, 8)} — Testifye` };
}

export default async function GapAnalysisPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <AppShell projectId={projectId}>
      <GapAnalysisClient projectId={projectId} />
    </AppShell>
  );
}
