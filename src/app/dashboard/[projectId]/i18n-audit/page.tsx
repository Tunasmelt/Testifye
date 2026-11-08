/**
 * /dashboard/[projectId]/i18n-audit
 * i18n / RTL Audit — Phase 4 Task 4.2
 */
import { AppShell } from '@/components/layout/AppShell';
import { I18nAuditClient } from './I18nAuditClient';

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata() {
  return { title: 'i18n Audit — Testifye' };
}

export default async function I18nAuditPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <AppShell projectId={projectId}>
      <I18nAuditClient projectId={projectId} />
    </AppShell>
  );
}
