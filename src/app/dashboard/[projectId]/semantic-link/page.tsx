/**
 * /dashboard/[projectId]/semantic-link
 * Semantic Link Engine — Phase 3 Task 3.3
 */
import { AppShell } from '@/components/layout/AppShell';
import { SemanticLinkClient } from './SemanticLinkClient';

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectId } = await params;
  return { title: `Semantic Link · ${projectId.slice(0, 8)} — Testifye` };
}

export default async function SemanticLinkPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <AppShell projectId={projectId}>
      <SemanticLinkClient projectId={projectId} />
    </AppShell>
  );
}
