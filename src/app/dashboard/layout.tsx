/**
 * Dashboard route segment.
 * NOTE: AppShell is instantiated per-page (not here) because each page
 * needs different projectId context for the sidebar. This layout is a passthrough.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
