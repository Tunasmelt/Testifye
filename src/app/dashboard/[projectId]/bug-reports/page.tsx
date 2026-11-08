import { AppShell } from '@/components/layout/AppShell';
import { BugReportsClient } from './BugReportsClient';

interface Props { params: Promise<{ projectId: string }> }

export async function generateMetadata() {
  return { title: 'Bug Reports — Testifye' };
}

export default async function BugReportsPage({ params }: Props) {
  const { projectId } = await params;
  return (
    <AppShell projectId={projectId}>
      <BugReportsClient projectId={projectId} />
    </AppShell>
  );
}
