import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, CircleAlert, ListChecks, Plus, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getCurrentCycleMonthKey, getCycleMonthKey } from '@/lib/app-settings';
import SummaryCard from '@/components/SummaryCard';
import PaymentCard from '@/components/PaymentCard';
import SegmentedControl from '@/components/SegmentedControl';
import PageShell from '@/components/layout/PageShell';
import { formatCurrency, formatShortDate, getDaysUntil, getDisplayStatus, getMonthLabel } from '@/lib/formatters';
import { toast } from 'sonner';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, markPaid, skipPayment } = useApp();
  const [filter, setFilter] = useState('7 dias');
  const [busyInstanceId, setBusyInstanceId] = useState<string | null>(null);

  const currentMonth = getCurrentCycleMonthKey(state.settings.monthStartDay);
  const monthLabel = getMonthLabel(currentMonth);
  const monthInstances = state.instances.filter(instance => getCycleMonthKey(instance.dueDate, state.settings.monthStartDay) === currentMonth);
  const totalMonth = monthInstances.reduce((sum, instance) => sum + instance.amount, 0);
  const overdueCount = monthInstances.filter(instance => getDisplayStatus(instance) === 'overdue').length;
  const paidCount = monthInstances.filter(instance => getDisplayStatus(instance) === 'paid').length;
  const completionRate = monthInstances.length ? Math.round((paidCount / monthInstances.length) * 100) : 0;

  const pendingInstances = monthInstances
    .filter(instance => {
      const status = getDisplayStatus(instance);
      return status === 'pending' || status === 'overdue';
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const nextPayment = pendingInstances[0];
  const nextTemplate = nextPayment ? state.templates.find(template => template.id === nextPayment.templateId) : null;
  const nextPaymentDays = nextPayment ? getDaysUntil(nextPayment.dueDate) : null;

  const filteredInstances = pendingInstances.filter(instance => {
    const days = getDaysUntil(instance.dueDate);
    if (filter === 'Hoy') return days <= 0;
    if (filter === '7 dias') return days <= 7;
    return true;
  });

  const filteredTotal = filteredInstances.reduce((sum, instance) => sum + instance.amount, 0);

  const upcomingByCategory = filteredInstances.reduce<Record<string, { name: string; total: number }>>((accumulator, instance) => {
    const template = state.templates.find(item => item.id === instance.templateId);
    const category = state.categories.find(item => item.id === template?.categoryId);
    if (!category) return accumulator;

    const current = accumulator[category.id] ?? { name: category.name, total: 0 };
    accumulator[category.id] = { ...current, total: current.total + instance.amount };
    return accumulator;
  }, {});

  const topCategories = Object.values(upcomingByCategory)
    .sort((first, second) => second.total - first.total)
    .slice(0, 3);
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';

  const handleMarkPaid = async (instanceId: string) => {
    if (busyInstanceId) return;

    setBusyInstanceId(instanceId);

    try {
      await markPaid(instanceId);
      toast.success('Pago marcado como pagado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el pago.';
      toast.error(message);
    } finally {
      setBusyInstanceId(current => current === instanceId ? null : current);
    }
  };

  const handleSkipPayment = async (instanceId: string) => {
    if (busyInstanceId) return;

    setBusyInstanceId(instanceId);

    try {
      await skipPayment(instanceId);
      toast.success('Pago saltado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el pago.';
      toast.error(message);
    } finally {
      setBusyInstanceId(current => current === instanceId ? null : current);
    }
  };

  return (
    <PageShell className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="page-surface overflow-hidden p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <p className="page-section-label">Dashboard</p>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Hola, {displayName}</h1>
                <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                  {monthLabel} va con {pendingInstances.length} pagos activos y una vision clara de lo que sigue esta semana.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/add-payment')}
              className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px] hover:opacity-95"
            >
              <Plus size={18} />
              Nuevo pago
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <SummaryCard title="Total del mes" value={formatCurrency(totalMonth, state.settings.currency)} subtitle={monthLabel} variant="primary" />
            <SummaryCard
              title="Proximo pago"
              value={nextTemplate?.name || 'Sin pendientes'}
              subtitle={nextPayment ? `Vence ${formatShortDate(nextPayment.dueDate)}` : 'No tienes pagos por revisar'}
            />
            <SummaryCard
              title="Alertas"
              value={overdueCount > 0 ? `${overdueCount} vencidos` : 'Todo al dia'}
              subtitle={overdueCount > 0 ? 'Conviene atenderlos hoy' : 'Tu flujo va estable'}
              variant={overdueCount > 0 ? 'danger' : 'success'}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Cobertura pagada</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{completionRate}%</p>
              <p className="mt-1 text-sm text-muted-foreground">{paidCount} de {monthInstances.length} movimientos ya cerrados</p>
            </div>
            <div className="rounded-[24px] bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Por revisar</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{formatCurrency(filteredTotal, state.settings.currency)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{filteredInstances.length} pagos segun el filtro actual</p>
            </div>
            <div className="rounded-[24px] bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Categorias activas</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{topCategories.length || state.categories.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">El gasto se concentra en {topCategories[0]?.name || 'tus categorias actuales'}</p>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="page-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="page-section-label">Focus</p>
                <h2 className="mt-3 text-xl font-semibold text-foreground">{nextTemplate?.name || 'Buen ritmo'}</h2>
              </div>
              <Sparkles size={18} className="text-primary" />
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-[22px] bg-primary/8 p-4">
                <p className="text-muted-foreground">Siguiente vencimiento</p>
                <p className="mt-1 font-semibold text-foreground">
                  {nextPayment
                    ? nextPaymentDays !== null && nextPaymentDays <= 0
                      ? 'Vence hoy'
                      : `En ${nextPaymentDays} dias`
                    : 'Sin pendientes'}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {nextPayment ? `${formatCurrency(nextPayment.amount, nextTemplate?.currency ?? state.settings.currency)} para ${formatShortDate(nextPayment.dueDate)}` : 'No hay acciones urgentes en este momento.'}
                </p>
              </div>

              <div className="space-y-2">
                {topCategories.length > 0 ? (
                  topCategories.map(category => (
                    <div key={category.name} className="flex items-center justify-between rounded-2xl bg-background/80 px-3.5 py-3">
                      <span className="text-foreground">{category.name}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(category.total, state.settings.currency)}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-background/80 px-3.5 py-3 text-muted-foreground">
                    Tus proximos pagos apareceran aqui.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="page-surface p-5">
            <p className="page-section-label">Atajos</p>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => navigate('/calendar')}
                className="flex w-full items-center justify-between rounded-[22px] bg-background/80 px-4 py-3 text-left transition-colors hover:bg-background"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <CalendarDays size={18} />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Abrir calendario</p>
                    <p className="text-sm text-muted-foreground">Ver dias con pagos y proximos vencimientos</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-muted-foreground" />
              </button>

              <button
                onClick={() => navigate('/history')}
                className="flex w-full items-center justify-between rounded-[22px] bg-background/80 px-4 py-3 text-left transition-colors hover:bg-background"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground">
                    <CircleAlert size={18} />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Revisar historial</p>
                    <p className="text-sm text-muted-foreground">Consulta pagos cerrados y saltados</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-muted-foreground" />
              </button>

              <button
                onClick={() => navigate('/payments')}
                className="flex w-full items-center justify-between rounded-[22px] bg-background/80 px-4 py-3 text-left transition-colors hover:bg-background"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ListChecks size={18} />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Administrar pagos</p>
                    <p className="text-sm text-muted-foreground">Edita montos, fechas o elimina pagos activos</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="page-section-label">Agenda</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">Pagos por atender</h2>
            </div>
            <div className="w-full max-w-md">
              <SegmentedControl options={['Hoy', '7 dias', 'Este mes']} value={filter} onChange={setFilter} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredInstances.map(instance => {
              const template = state.templates.find(item => item.id === instance.templateId)!;
              const category = state.categories.find(item => item.id === template.categoryId)!;

              return (
                <PaymentCard
                  key={instance.id}
                  instance={instance}
                  template={template}
                  category={category}
                  busy={busyInstanceId === instance.id}
                  onTap={() => navigate(`/payment/${instance.id}`)}
                  onMarkPaid={() => void handleMarkPaid(instance.id)}
                  onSkip={() => void handleSkipPayment(instance.id)}
                />
              );
            })}

            {filteredInstances.length === 0 && (
              <div className="page-surface col-span-full flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
                <p className="text-lg font-semibold text-foreground">Sin pagos pendientes</p>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">Tu bandeja esta limpia para este filtro. Puedes revisar otras fechas o agregar un nuevo pago.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="page-surface h-fit p-5 xl:sticky xl:top-8">
          <p className="page-section-label">Resumen del filtro</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-[24px] bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Total visible</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{formatCurrency(filteredTotal, state.settings.currency)}</p>
            </div>

            <div className="space-y-3">
              {filteredInstances.slice(0, 4).map(instance => {
                const template = state.templates.find(item => item.id === instance.templateId)!;
                return (
                  <div key={instance.id} className="flex items-center justify-between rounded-2xl bg-background/80 px-3.5 py-3">
                    <div>
                      <p className="font-medium text-foreground">{template.name}</p>
                      <p className="text-sm text-muted-foreground">{formatShortDate(instance.dueDate)}</p>
                    </div>
                    <span className="font-semibold text-foreground">{formatCurrency(instance.amount, template.currency)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </section>

      <button
        onClick={() => navigate('/add-payment')}
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl active:scale-95 md:hidden"
      >
        <Plus size={28} />
      </button>
    </PageShell>
  );
};

export default Home;
