import { Check, ChevronRight, SkipForward } from 'lucide-react';
import { Category, PaymentInstance, PaymentTemplate } from '@/types';
import { formatCurrency, formatShortDate, getBadgeText, getDisplayStatus } from '@/lib/formatters';
import CategoryIcon from './CategoryIcon';
import StatusBadge from './StatusBadge';

interface Props {
  instance: PaymentInstance;
  template: PaymentTemplate;
  category: Category;
  onTap: () => void;
  onMarkPaid: () => void;
  onSkip: () => void;
  busy?: boolean;
}

const PaymentCard = ({ instance, template, category, onTap, onMarkPaid, onSkip, busy = false }: Props) => {
  const badge = getBadgeText(instance, template);
  const displayStatus = getDisplayStatus(instance);
  const isDone = displayStatus === 'paid' || displayStatus === 'skipped';

  return (
    <div
      onClick={onTap}
      className="page-surface animate-slide-up cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_32px_80px_-48px_hsl(var(--foreground)/0.45)] active:scale-[0.99] md:p-5"
    >
      <div className="flex w-full items-start gap-4">
        <CategoryIcon icon={category.icon} categoryId={category.id} className="h-12 w-12 rounded-2xl" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-semibold text-card-foreground">{template.name}</p>
                <ChevronRight size={16} className="hidden text-muted-foreground md:block" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{category.name} - vence {formatShortDate(instance.dueDate)}</p>
            </div>

            <div className="flex items-center gap-3 md:flex-col md:items-end md:text-right">
              <p className="text-base font-semibold text-card-foreground md:text-lg">{formatCurrency(instance.amount, template.currency)}</p>
              <StatusBadge status={displayStatus} label={badge} />
            </div>
          </div>

          {!isDone && (
            <div className={`mt-4 flex flex-wrap gap-2 ${busy ? 'pointer-events-none opacity-70' : ''}`}>
              <button
                onClick={event => {
                  event.stopPropagation();
                  if (!busy) onMarkPaid();
                }}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-status-paid/15 px-3.5 py-2 text-sm font-medium text-status-paid transition-colors hover:bg-status-paid/25 disabled:cursor-not-allowed"
              >
                <Check size={16} />
                Marcar pagado
              </button>
              <button
                onClick={event => {
                  event.stopPropagation();
                  if (!busy) onSkip();
                }}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:cursor-not-allowed"
              >
                <SkipForward size={14} />
                Saltar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCard;
