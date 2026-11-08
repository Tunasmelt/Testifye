/**
 * /dashboard/[projectId]/persona-friction
 * Persona Friction Analysis — Phase 4 Task 4.1
 */
import { AppShell } from '@/components/layout/AppShell';
import { PersonaFrictionClient } from './PersonaFrictionClient';

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata() {
  return { title: 'Persona Friction — Testifye' };
}

export default async function PersonaFrictionPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <AppShell projectId={projectId}>
      <PersonaFrictionClient projectId={projectId} />
    </AppShell>
  );
}
