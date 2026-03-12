import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock3 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useApp } from '@/context/AppContext';
import { formatCurrency, getDisplayStatus } from '@/lib/formatters';
import CategoryIcon from '@/components/CategoryIcon';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/layout/PageHeader';
import PageShell from '@/components/layout/PageShell';
import { cn } from '@/lib/utils';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const CalendarPage = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const paymentDates = state.instances.map(instance => new Date(`${instance.dueDate}T00:00:00`));

  const selectedDateStr = selected
    ? `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`
    : '';

  const dayInstances = state.instances.filter(instance => instance.dueDate === selectedDateStr);
  const dayTotal = dayInstances.reduce((sum, instance) => sum + instance.amount, 0);
  const selectedLabel = selected ? `${selected.getDate()} de ${MONTH_NAMES[selected.getMonth()]}` : 'Sin fecha';

  return (
    <PageShell className="space-y-8">
      <PageHeader
        eyebrow="Agenda"
        title="Calendario de pagos"
        subtitle="Consulta rapidamente que dias concentran pagos, revisa montos y entra al detalle desde una vista mas comoda para escritorio."
      />

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="page-surface h-fit p-4 md:p-5 xl:sticky xl:top-8">
          <div className="flex items-center gap-3 rounded-[24px] bg-background/80 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarDays size={18} />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Seleccion actual</p>
              <p className="font-semibold text-foreground">{selectedLabel}</p>
            </div>
          </div>

          <div className="mt-4 rounded-[28px] bg-card/80 p-2">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={setSelected}
              className={cn('pointer-events-auto p-3')}
              modifiers={{ hasPayment: paymentDates }}
              modifiersStyles={{
                hasPayment: {
                  fontWeight: 700,
                  textDecoration: 'underline',
                  textDecorationColor: 'hsl(162, 63%, 41%)',
                  textUnderlineOffset: '4px',
                },
              }}
            />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[24px] bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Pagos ese dia</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{dayInstances.length}</p>
            </div>
            <div className="rounded-[24px] bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Monto estimado</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{formatCurrency(dayTotal, state.settings.currency)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="page-section-label">Detalle diario</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">Pagos del {selectedLabel}</h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-card/70 px-3 py-2 text-sm text-muted-foreground md:flex">
              <Clock3 size={16} />
              Vista detallada
            </div>
          </div>

          {dayInstances.length > 0 ? (
            <div className="grid gap-4">
              {dayInstances.map(instance => {
                const template = state.templates.find(item => item.id === instance.templateId)!;
                const category = state.categories.find(item => item.id === template.categoryId);

                return (
                  <div
                    key={instance.id}
                    onClick={() => navigate(`/payment/${instance.id}`)}
                    className="page-surface cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_32px_80px_-48px_hsl(var(--foreground)/0.45)] md:p-5"
                  >
                    <div className="flex items-center gap-4">
                      {category && <CategoryIcon icon={category.icon} categoryId={category.id} className="h-12 w-12 rounded-2xl" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-card-foreground">{template.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{category?.name || 'Sin categoria'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-card-foreground">{formatCurrency(instance.amount, template.currency)}</p>
                      <div className="mt-2">
                          <StatusBadge status={getDisplayStatus(instance)} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="page-surface flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <p className="text-lg font-semibold text-foreground">Sin pagos este dia</p>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">Selecciona otra fecha del calendario para revisar vencimientos o entra al dashboard para registrar uno nuevo.</p>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
};

export default CalendarPage;
