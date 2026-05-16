/**
 * /dashboard/[projectId]/test-cases
 * Test suite generator page — Scout → Generator → Judge pipeline.
 */
import { AppShell } from '@/components/layout/AppShell';
import { TestCasesClient } from './TestCasesClient';

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectId } = await params;
  void projectId;
  return { title: 'Test Cases — Testifye' };
}

export default async function TestCasesPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <AppShell projectId={projectId}>
      <TestCasesClient projectId={projectId} />
    </AppShell>
  );
}
