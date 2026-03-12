import { Outlet } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import BottomNav from './BottomNav';
import DesktopSidebar from './DesktopSidebar';
import WebAppPrompts from '@/components/system/WebAppPrompts';

const AppLayout = () => {
  const { loading, error } = useApp();

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-0 h-72 w-72 rounded-full bg-primary/12 blur-3xl dark:bg-primary/7 dark:blur-[140px]" />
        <div className="absolute right-[8%] top-[10%] h-80 w-80 rounded-full bg-accent/12 blur-3xl dark:bg-accent/6 dark:blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-secondary/70 blur-3xl dark:bg-secondary/26 dark:blur-[160px]" />
      </div>

      <DesktopSidebar />

      <div className="relative md:pl-[280px]">
        <div className="mx-auto max-w-[1680px]">
          {loading ? (
            <div className="page-shell">
              <div className="page-surface flex min-h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Preparando tus datos...</p>
                    <p className="text-sm text-muted-foreground">Esto tarda solo un momento.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <WebAppPrompts />
              {error && (
                <div className="px-4 pt-4 md:px-8 md:pt-6">
                  <div className="page-surface border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                </div>
              )}
              <Outlet />
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
