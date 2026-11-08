/**
 * /dashboard/[projectId]/test-data
 * Synthetic Test Data Generator — Phase 3 Task 3.4
 */
import { AppShell } from '@/components/layout/AppShell';
import { TestDataClient } from './TestDataClient';

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectId } = await params;
  return { title: `Test Data · ${projectId.slice(0, 8)} — Testifye` };
}

export default async function TestDataPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <AppShell projectId={projectId}>
      <TestDataClient projectId={projectId} />
    </AppShell>
  );
}
