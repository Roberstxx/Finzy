import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

const PageHeader = ({ title, subtitle, eyebrow, actions, className }: PageHeaderProps) => {
  return (
    <div className={cn('flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="space-y-2">
        {eyebrow && <p className="page-section-label">{eyebrow}</p>}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
          {subtitle && <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</p>}
        </div>
      </div>

      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
};

export default PageHeader;
