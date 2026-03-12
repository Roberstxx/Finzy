import type { ReactNode } from 'react';
import { Wallet } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const AuthShell = ({ title, subtitle, children, footer }: AuthShellProps) => {
  return (
    <div className="min-h-[100dvh] px-4 py-8 md:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1280px] gap-6 xl:grid-cols-[0.95fr_minmax(0,1.05fr)]">
        <section className="page-surface hidden overflow-hidden xl:flex xl:flex-col xl:justify-between xl:p-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <Wallet size={24} className="text-primary-foreground" />
              </div>
              <div>
                <p className="page-section-label">Finzy</p>
                <h1 className="mt-1 text-2xl font-semibold text-foreground">Controla pagos con una vista mas clara</h1>
              </div>
            </div>

            <div className="mt-8 rounded-[32px] bg-[linear-gradient(145deg,hsl(var(--primary)),hsl(var(--primary)/0.82))] p-6 text-primary-foreground">
              <p className="text-sm uppercase tracking-[0.24em] text-primary-foreground/75">Workspace</p>
              <p className="mt-4 text-3xl font-semibold">Tu panel ya esta listo para escritorio</p>
              <p className="mt-3 max-w-md text-sm text-primary-foreground/80">
                Administra vencimientos, historial y categorias con una interfaz mas limpia, amplia y enfocada en productividad web.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Vista</p>
              <p className="mt-2 text-xl font-semibold text-foreground">Desktop-first</p>
            </div>
            <div className="rounded-[24px] bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Organizacion</p>
              <p className="mt-2 text-xl font-semibold text-foreground">Mas limpia</p>
            </div>
            <div className="rounded-[24px] bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Flujo</p>
              <p className="mt-2 text-xl font-semibold text-foreground">Mas rapido</p>
            </div>
          </div>
        </section>

        <section className="page-surface mx-auto flex w-full max-w-xl flex-col justify-center p-6 md:p-8 xl:max-w-none">
          <div className="mb-8 space-y-3 text-center xl:text-left">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/20 xl:mx-0">
              <Wallet size={30} className="text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">{subtitle}</p>
            </div>
          </div>

          {children}

          <div className="mt-8">{footer}</div>
        </section>
      </div>
    </div>
  );
};

export default AuthShell;
