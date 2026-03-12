import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

const PageShell = ({ children, className }: PageShellProps) => {
  return <div className={cn('page-shell', className)}>{children}</div>;
};

export default PageShell;
