import { cn } from '@/lib/utils';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  variant?: 'default' | 'primary' | 'success' | 'danger';
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'border-border/70 bg-card/90 text-card-foreground dark:bg-card/78',
  primary: 'border-primary/15 bg-[linear-gradient(145deg,hsl(var(--primary)),hsl(var(--primary)/0.85))] text-primary-foreground shadow-lg shadow-primary/20 dark:border-primary/20 dark:bg-[linear-gradient(145deg,hsl(var(--primary)/0.92),hsl(var(--primary)/0.72))] dark:shadow-primary/10',
  success: 'border-status-paid/15 bg-status-paid/10 text-card-foreground dark:bg-status-paid/8',
  danger: 'border-status-overdue/15 bg-status-overdue/10 text-card-foreground dark:bg-status-overdue/8',
};

const SummaryCard = ({ title, value, subtitle, variant = 'default', className }: Props) => {
  return (
    <div
      className={cn(
        'relative min-w-[210px] flex-shrink-0 overflow-hidden rounded-[28px] border p-5 shadow-[0_24px_60px_-40px_hsl(var(--foreground)/0.45)] dark:shadow-[0_26px_68px_-46px_hsl(220_45%_2%/0.95)] md:min-w-0 md:p-6',
        variantStyles[variant],
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />
      <p className={cn('mb-2 text-xs font-semibold uppercase tracking-[0.18em]', variant === 'primary' ? 'opacity-75' : 'text-muted-foreground')}>
        {title}
      </p>
      <p className="text-xl font-semibold leading-tight md:text-2xl">{value}</p>
      {subtitle && (
        <p className={cn('mt-2 text-sm', variant === 'primary' ? 'opacity-75' : 'text-muted-foreground')}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SummaryCard;
