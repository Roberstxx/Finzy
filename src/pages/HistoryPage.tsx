import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatShortDate } from '@/lib/formatters';
import CategoryIcon from '@/components/CategoryIcon';
import StatusBadge from '@/components/StatusBadge';
import SegmentedControl from '@/components/SegmentedControl';
import PageHeader from '@/components/layout/PageHeader';
import PageShell from '@/components/layout/PageShell';
import SummaryCard from '@/components/SummaryCard';

const HistoryPage = () => {
  const { state } = useApp();
  const [statusFilter, setStatusFilter] = useState('Todos');

  const completedInstances = state.instances
    .filter(instance => {
      if (statusFilter === 'Pagados') return instance.status === 'paid';
      if (statusFilter === 'Saltados') return instance.status === 'skipped';
      return instance.status === 'paid' || instance.status === 'skipped';
    })
    .sort((first, second) => second.dueDate.localeCompare(first.dueDate));

  const paidCount = state.instances.filter(instance => instance.status === 'paid').length;
  const skippedCount = state.instances.filter(instance => instance.status === 'skipped').length;
  const totalClosed = completedInstances.reduce((sum, instance) => sum + instance.amount, 0);

  return (
    <PageShell className="space-y-8">
      <PageHeader
        eyebrow="Seguimiento"
        title="Historial de pagos"
        subtitle="Revisa rapidamente los movimientos ya resueltos, detecta pagos saltados y valida montos desde una vista mas limpia para escritorio."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <SummaryCard title="Cerrados visibles" value={completedInstances.length.toString()} subtitle="Segun el filtro actual" variant="primary" />
        <SummaryCard title="Pagados" value={paidCount.toString()} subtitle="Movimientos liquidados" />
        <SummaryCard title="Saltados" value={skippedCount.toString()} subtitle={`Total acumulado ${formatCurrency(totalClosed, state.settings.currency)}`} variant={skippedCount > 0 ? 'danger' : 'success'} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="page-section-label">Filtros</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">Actividad resuelta</h2>
          </div>
          <div className="w-full max-w-sm">
            <SegmentedControl options={['Todos', 'Pagados', 'Saltados']} value={statusFilter} onChange={setStatusFilter} />
          </div>
        </div>

        {completedInstances.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {completedInstances.map(instance => {
              const template = state.templates.find(item => item.id === instance.templateId)!;
              const category = state.categories.find(item => item.id === template.categoryId);

              return (
                <div key={instance.id} className="page-surface animate-slide-up p-4 md:p-5">
                  <div className="flex items-center gap-4">
                    {category && <CategoryIcon icon={category.icon} categoryId={category.id} className="h-12 w-12 rounded-2xl" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-card-foreground">{template.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{category?.name || 'Sin categoria'} - {formatShortDate(instance.dueDate)}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Monto</p>
                      <p className="text-lg font-semibold text-card-foreground">{formatCurrency(instance.amount, template.currency)}</p>
                    </div>
                    <StatusBadge status={instance.status} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="page-surface flex min-h-[260px] items-center justify-center px-6 text-center">
            <p className="max-w-md text-sm text-muted-foreground">No hay registros para este filtro todavia. En cuanto cierres o saltes pagos, apareceran aqui.</p>
          </div>
        )}
      </section>
    </PageShell>
  );
};

export default HistoryPage;
