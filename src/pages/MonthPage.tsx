import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, PiggyBank } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useApp } from '@/context/AppContext';
import { getCurrentCycleMonthKey, getCycleMonthKey } from '@/lib/app-settings';
import { formatCurrency, getDisplayStatus, getMonthLabel, shiftMonthKey } from '@/lib/formatters';
import CategoryIcon from '@/components/CategoryIcon';
import PageHeader from '@/components/layout/PageHeader';
import PageShell from '@/components/layout/PageShell';
import SummaryCard from '@/components/SummaryCard';
import { toast } from 'sonner';

const CHART_COLORS = ['#149770', '#2563eb', '#f97316', '#db2777', '#7c3aed', '#0891b2'];

const MonthPage = () => {
  const { state, setIncomeEstimate } = useApp();
  const [monthKey, setMonthKey] = useState(() => getCurrentCycleMonthKey(state.settings.monthStartDay));
  const [incomeInput, setIncomeInput] = useState(String(state.settings.incomeEstimate));

  useEffect(() => {
    setMonthKey(getCurrentCycleMonthKey(state.settings.monthStartDay));
  }, [state.settings.monthStartDay]);

  useEffect(() => {
    setIncomeInput(String(state.settings.incomeEstimate));
  }, [state.settings.incomeEstimate]);

  const monthInstances = state.instances.filter(instance => getCycleMonthKey(instance.dueDate, state.settings.monthStartDay) === monthKey);
  const total = monthInstances.reduce((sum, instance) => sum + instance.amount, 0);
  const balance = state.settings.incomeEstimate - total;
  const pendingCount = monthInstances.filter(instance => {
    const status = getDisplayStatus(instance);
    return status === 'pending' || status === 'overdue';
  }).length;

  const byCategory = state.categories
    .map(category => {
      const categoryTemplates = state.templates.filter(template => template.categoryId === category.id);
      const categoryTotal = monthInstances
        .filter(instance => categoryTemplates.some(template => template.id === instance.templateId))
        .reduce((sum, instance) => sum + instance.amount, 0);

      return { ...category, total: categoryTotal };
    })
    .filter(category => category.total > 0);

  const chartData = byCategory.map(category => ({ name: category.name, value: category.total }));
  const recurrent = state.templates.filter(template => template.type === 'recurrent' && template.active);
  const installments = state.templates.filter(template => template.type === 'installment' && template.active);

  const handleSaveIncome = async () => {
    const amount = Number(incomeInput) || 0;

    try {
      await setIncomeEstimate(amount);
    } catch {
      toast.error('No se pudo guardar el ingreso estimado.');
    }
  };

  return (
    <PageShell className="space-y-8">
      <PageHeader
        eyebrow="Planeacion"
        title={getMonthLabel(monthKey)}
        subtitle="Una vista mensual mas amplia para controlar el total gastado, el balance estimado y la distribucion por categoria."
        actions={
          <>
            <button
              onClick={() => setMonthKey(current => shiftMonthKey(current, -1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-card/80 text-foreground transition-colors hover:bg-card"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setMonthKey(current => shiftMonthKey(current, 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-card/80 text-foreground transition-colors hover:bg-card"
            >
              <ChevronRight size={20} />
            </button>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <SummaryCard
          title="Gastado"
          value={formatCurrency(total, state.settings.currency)}
          subtitle={`${pendingCount} pagos pendientes por cerrar`}
          variant="primary"
        />

        <div className="page-surface p-5 md:p-6">
          <p className="page-section-label">Ingreso estimado</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <PiggyBank size={18} />
            </span>
            <input
              type="number"
              value={incomeInput}
              onChange={event => setIncomeInput(event.target.value)}
              onBlur={() => void handleSaveIncome()}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.currentTarget.blur();
                }
              }}
              className="w-full bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Este valor se conserva para tus siguientes sesiones.</p>
        </div>

        <div className="page-surface p-5 md:p-6">
          <p className="page-section-label">Balance</p>
          <p className={`mt-4 text-3xl font-semibold ${balance >= 0 ? 'text-status-paid' : 'text-status-overdue'}`}>
            {formatCurrency(balance, state.settings.currency)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {balance >= 0 ? 'Vas por debajo de tu ingreso estimado.' : 'El gasto del mes ya supera el ingreso capturado.'}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="page-surface p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="page-section-label">Distribucion</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Gasto por categoria</h2>
              </div>
              <p className="text-sm text-muted-foreground">Detecta facilmente donde se concentra el presupuesto.</p>
            </div>

            {chartData.length > 0 ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={68} outerRadius={96} dataKey="value" paddingAngle={3} strokeWidth={0}>
                        {chartData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {byCategory.map((category, index) => (
                    <div key={category.id} className="flex items-center gap-3 rounded-[24px] bg-background/80 px-4 py-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <CategoryIcon icon={category.icon} categoryId={category.id} size={16} className="h-9 w-9 rounded-2xl" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-card-foreground">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{Math.round((category.total / total) * 100)}% del total mensual</p>
                      </div>
                      <span className="font-semibold text-card-foreground">{formatCurrency(category.total, state.settings.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] bg-background/80 px-4 py-5 text-sm text-muted-foreground">
                Aun no hay movimientos en este mes. Aqui apareceran conforme vayas registrando tus pagos.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {recurrent.length > 0 && (
            <div className="page-surface overflow-hidden">
              <div className="border-b border-border/60 px-5 py-4">
                <p className="page-section-label">Pagos fijos</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Recurrentes activos</h2>
              </div>
              <div className="divide-y divide-border/60">
                {recurrent.map(template => {
                  const instance = monthInstances.find(item => item.templateId === template.id);
                  return (
                    <div key={template.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div>
                        <p className="font-medium text-card-foreground">{template.name}</p>
                        <p className="text-sm text-muted-foreground">Vence el {instance ? new Date(`${instance.dueDate}T00:00:00`).getDate() : '--'} del mes</p>
                      </div>
                      <span className="font-semibold text-card-foreground">{formatCurrency(template.amount, template.currency)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {installments.length > 0 && (
            <div className="page-surface overflow-hidden">
              <div className="border-b border-border/60 px-5 py-4">
                <p className="page-section-label">Compras a meses</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Cuotas activas</h2>
              </div>
              <div className="divide-y divide-border/60">
                {installments.map(template => (
                  <div key={template.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="font-medium text-card-foreground">{template.name}</p>
                      <p className="text-sm text-muted-foreground">{template.installmentPaid}/{template.installmentTotal} cuotas cubiertas</p>
                    </div>
                    <span className="font-semibold text-card-foreground">{formatCurrency(template.amount, template.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
};

export default MonthPage;
