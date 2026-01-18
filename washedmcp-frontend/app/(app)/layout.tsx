import { Sidebar } from '@/components/layout/Sidebar';
import { AppLoadProvider } from '@/components/layout/AppLoadProvider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLoadProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-(--color-background)">{children}</main>
      </div>
    </AppLoadProvider>
  );
}
