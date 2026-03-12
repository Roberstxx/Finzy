import { cn } from '@/lib/utils';
import { PaymentStatus } from '@/types';

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-status-pending/15 text-status-pending' },
  paid: { label: 'Pagado', className: 'bg-status-paid/15 text-status-paid' },
  overdue: { label: 'Vencido', className: 'bg-status-overdue/15 text-status-overdue' },
  skipped: { label: 'Saltado', className: 'bg-status-skipped/15 text-status-skipped' },
};

const StatusBadge = ({ status, label }: { status: PaymentStatus; label?: string }) => {
  const config = statusConfig[status];
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {label || config.label}
    </span>
  );
};

export default StatusBadge;
