/**
 * /dashboard/[projectId]/ux-audit
 * UX/UI Auditor page — Phase 2 Task 2.1
 */
import { AppShell } from '@/components/layout/AppShell';
import { UXAuditClient } from './UXAuditClient';

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata() {
  return { title: 'UX Audit — Testifye' };
}

export default async function UXAuditPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <AppShell projectId={projectId}>
      <UXAuditClient projectId={projectId} />
    </AppShell>
  );
}
