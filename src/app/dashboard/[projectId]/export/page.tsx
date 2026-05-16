import { AppShell } from '@/components/layout/AppShell';
import { ExportClient } from './ExportClient';

interface Props { params: Promise<{ projectId: string }> }

export const metadata = { title: 'Export — Testifye' };

export default async function ExportPage({ params }: Props) {
  const { projectId } = await params;
  return (
    <AppShell projectId={projectId}>
      <ExportClient projectId={projectId} />
    </AppShell>
  );
}
