import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, ListChecks, PencilLine, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/layout/PageHeader';
import PageShell from '@/components/layout/PageShell';
import SummaryCard from '@/components/SummaryCard';
import StatusBadge from '@/components/StatusBadge';
import CategoryIcon from '@/components/CategoryIcon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  formatCurrency,
  formatFullDate,
  getBadgeText,
  getDisplayStatus,
  getFrequencyLabel,
  getReminderSummary,
  getTypeLabel,
} from '@/lib/formatters';

const REMINDER_OPTIONS = ['7 dias antes', '3 dias antes', '1 dia antes', 'El dia exacto'];
const REMINDER_DAY_MAP: Record<string, number> = {
  '7 dias antes': 7,
  '3 dias antes': 3,
  '1 dia antes': 1,
};

const PaymentsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state, loading, updatePayment, deleteTemplate } = useApp();
  const [query, setQuery] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [notes, setNotes] = useState('');
  const [reminders, setReminders] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [installmentTotal, setInstallmentTotal] = useState('');
  const [installmentPaid, setInstallmentPaid] = useState('');

  const activePayments = useMemo(() => (
    state.templates
      .filter(template => template.active)
      .map(template => {
        const instances = state.instances
          .filter(instance => instance.templateId === template.id)
          .sort((first, second) => first.dueDate.localeCompare(second.dueDate));
        const currentInstance =
          instances.find(instance => {
            const status = getDisplayStatus(instance);
            return status === 'pending' || status === 'overdue';
          }) ?? instances[0] ?? null;
        const category = state.categories.find(item => item.id === template.categoryId) ?? null;

        return {
          template,
          category,
          currentInstance,
          status: currentInstance ? getDisplayStatus(currentInstance) : null,
        };
      })
      .sort((first, second) => {
        const firstDue = first.currentInstance?.dueDate ?? first.template.startDate;
        const secondDue = second.currentInstance?.dueDate ?? second.template.startDate;
        return firstDue.localeCompare(secondDue);
      })
  ), [state.categories, state.instances, state.templates]);

  const filteredPayments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return activePayments;
    }

    return activePayments.filter(({ template, category }) => {
      const haystack = [
        template.name,
        category?.name,
        getTypeLabel(template.type),
        getFrequencyLabel(template.frequency),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [activePayments, query]);

  const editingPayment = editingTemplateId
    ? activePayments.find(item => item.template.id === editingTemplateId) ?? null
    : null;

  const deletePayment = deleteTemplateId
    ? activePayments.find(item => item.template.id === deleteTemplateId) ?? null
    : null;

  const visibleTotal = filteredPayments.reduce(
    (sum, item) => sum + (item.currentInstance?.amount ?? item.template.amount),
    0,
  );
  const pendingCount = activePayments.filter(item => item.status === 'pending' || item.status === 'overdue').length;
  const overdueCount = activePayments.filter(item => item.status === 'overdue').length;

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;

    const exists = activePayments.some(item => item.template.id === editId);
    if (exists) {
      setEditingTemplateId(editId);
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('edit');
    setSearchParams(nextSearchParams, { replace: true });
  }, [activePayments, searchParams, setSearchParams]);

  useEffect(() => {
    if (!editingPayment) return;

    setName(editingPayment.template.name);
    setCategoryId(editingPayment.template.categoryId);
    setAmount(String(editingPayment.currentInstance?.amount ?? editingPayment.template.amount));
    setDueDate(editingPayment.currentInstance?.dueDate ?? editingPayment.template.startDate);
    setFrequency(editingPayment.template.frequency);
    setNotes(editingPayment.template.notes ?? editingPayment.currentInstance?.notes ?? '');
    setReminders(templateToReminderLabels(editingPayment.template));
    setReminderTime(editingPayment.template.reminderTime ?? '09:00');
    setInstallmentTotal(editingPayment.template.installmentTotal ? String(editingPayment.template.installmentTotal) : '');
    setInstallmentPaid(editingPayment.template.installmentPaid ? String(editingPayment.template.installmentPaid) : '0');
  }, [editingPayment]);

  const openEditor = (templateId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('edit', templateId);
    setSearchParams(nextSearchParams, { replace: true });
    setEditingTemplateId(templateId);
  };

  const closeEditor = () => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('edit');
    setSearchParams(nextSearchParams, { replace: true });
    setEditingTemplateId(null);
  };

  const toggleReminder = (reminder: string) => {
    setReminders(current =>
      current.includes(reminder)
        ? current.filter(item => item !== reminder)
        : [...current, reminder],
    );
  };

  const handleSave = async () => {
    if (!editingPayment || saving) return;

    const trimmedName = name.trim();
    const parsedAmount = Number(amount);

    if (!trimmedName || !categoryId || parsedAmount <= 0 || !dueDate) {
      toast.error('Completa nombre, categoria, monto y vencimiento.');
      return;
    }

    if (editingPayment.template.type === 'installment') {
      const total = Number(installmentTotal);
      const paid = Number(installmentPaid);

      if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(paid) || paid < 0 || paid > total) {
        toast.error('Revisa el progreso de cuotas antes de guardar.');
        return;
      }
    }

    setSaving(true);

    try {
      await updatePayment({
        templateId: editingPayment.template.id,
        instanceId: editingPayment.currentInstance?.id,
        name: trimmedName,
        categoryId,
        amount: parsedAmount,
        dueDate,
        frequency: frequency as typeof editingPayment.template.frequency,
        notes,
        reminderDaysBefore: reminders
          .filter(reminder => reminder in REMINDER_DAY_MAP)
          .map(reminder => REMINDER_DAY_MAP[reminder]),
        reminderOnDueDate: reminders.includes('El dia exacto'),
        reminderTime,
        installmentTotal: editingPayment.template.type === 'installment' ? Number(installmentTotal) : undefined,
        installmentPaid: editingPayment.template.type === 'installment' ? Number(installmentPaid) : undefined,
      });

      toast.success('Pago actualizado correctamente.');
      closeEditor();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el pago.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePayment || deleting) return;

    setDeleting(true);

    try {
      await deleteTemplate(deletePayment.template.id);
      toast.success('Pago eliminado correctamente.');

      if (editingTemplateId === deletePayment.template.id) {
        closeEditor();
      }

      setDeleteTemplateId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el pago.';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <PageShell className="mx-auto max-w-[1320px]">
        <div className="page-surface flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Preparando tus datos...</p>
              <p className="text-sm text-muted-foreground">Estamos reuniendo tus pagos activos.</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-8">
      <PageHeader
        eyebrow="Control"
        title="Pagos activos"
        subtitle="Un solo lugar para revisar, corregir montos, editar vencimientos o eliminar pagos que ya no quieras seguir viendo."
        actions={(
          <>
            <button
              onClick={() => navigate('/add-payment')}
              className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:translate-y-[-1px]"
            >
              <Plus size={18} />
              Nuevo pago
            </button>
          </>
        )}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Activos" value={activePayments.length.toString()} subtitle="Plantillas visibles para seguimiento" variant="primary" />
        <SummaryCard title="Por atender" value={pendingCount.toString()} subtitle={overdueCount > 0 ? `${overdueCount} ya vencidos` : 'Sin vencidos por ahora'} />
        <SummaryCard title="Monto visible" value={formatCurrency(visibleTotal, state.settings.currency)} subtitle="Segun los pagos filtrados" />
      </section>

      <section className="space-y-4">
        <div className="page-surface p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="page-section-label">Listado</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">Todos tus pagos activos</h2>
            </div>

            <div className="relative w-full max-w-md">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Buscar por nombre, categoria o tipo"
                className="h-12 rounded-2xl border-border/70 bg-background/80 pl-11"
              />
            </div>
          </div>
        </div>

        {filteredPayments.length > 0 ? (
          <div className="grid gap-4">
            {filteredPayments.map(item => {
              const dueDate = item.currentInstance?.dueDate ?? item.template.startDate;
              const displayStatus = item.currentInstance ? getDisplayStatus(item.currentInstance) : null;
              const badgeLabel = item.currentInstance ? getBadgeText(item.currentInstance, item.template) : 'Activo';

              return (
                <div key={item.template.id} className="page-surface p-5 md:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 space-y-4">
                      <div className="flex items-start gap-4">
                        {item.category && (
                          <CategoryIcon
                            icon={item.category.icon}
                            categoryId={item.category.id}
                            className="h-12 w-12 rounded-2xl"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-xl font-semibold text-foreground">{item.template.name}</h3>
                            {displayStatus ? (
                              <StatusBadge status={displayStatus} label={badgeLabel} />
                            ) : (
                              <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">Activo</span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.category?.name || 'Sin categoria'} - {getTypeLabel(item.template.type)} - {getFrequencyLabel(item.template.frequency)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <InfoPill label="Monto" value={formatCurrency(item.currentInstance?.amount ?? item.template.amount, item.template.currency)} />
                        <InfoPill label="Vence" value={formatFullDate(dueDate)} />
                        <InfoPill label="Recordatorios" value={getReminderSummary(item.template)} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                      {item.currentInstance && (
                        <button
                          onClick={() => navigate(`/payment/${item.currentInstance!.id}`)}
                          className="inline-flex items-center gap-2 rounded-[20px] bg-background/80 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
                        >
                          <ArrowUpRight size={16} />
                          Ver detalle
                        </button>
                      )}
                      <button
                        onClick={() => openEditor(item.template.id)}
                        className="inline-flex items-center gap-2 rounded-[20px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:translate-y-[-1px]"
                      >
                        <PencilLine size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteTemplateId(item.template.id)}
                        className="inline-flex items-center gap-2 rounded-[20px] bg-destructive/12 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/18"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="page-surface flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <ListChecks size={28} className="text-primary" />
            <p className="mt-4 text-xl font-semibold text-foreground">No hay pagos para mostrar</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {query
                ? 'Prueba con otro termino de busqueda o limpia el filtro para ver tus pagos activos.'
                : 'Cuando agregues pagos, aqui podras corregir montos, fechas y eliminarlos sin perder tiempo buscando uno por uno.'}
            </p>
          </div>
        )}
      </section>

      <Dialog open={Boolean(editingPayment)} onOpenChange={open => { if (!open) closeEditor(); }}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[28px] border-border/70 bg-card sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar pago activo</DialogTitle>
            <DialogDescription>Actualiza los datos principales del pago sin salir del listado.</DialogDescription>
          </DialogHeader>

          {editingPayment && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre">
                <Input value={name} onChange={event => setName(event.target.value)} className="h-12 rounded-2xl border-border/70 bg-background/80" />
              </Field>

              <Field label="Categoria">
                <select
                  value={categoryId}
                  onChange={event => setCategoryId(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  {state.categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={`Monto (${editingPayment.template.currency})`}>
                <Input value={amount} onChange={event => setAmount(event.target.value)} type="number" className="h-12 rounded-2xl border-border/70 bg-background/80" />
              </Field>

              <Field label="Vencimiento actual">
                <Input value={dueDate} onChange={event => setDueDate(event.target.value)} type="date" className="h-12 rounded-2xl border-border/70 bg-background/80" />
              </Field>

              <Field label="Frecuencia">
                <select
                  value={frequency}
                  onChange={event => setFrequency(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  {['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'].map(option => (
                    <option key={option} value={option}>
                      {getFrequencyLabel(option)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Tipo">
                <div className="flex h-12 items-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm text-muted-foreground">
                  {getTypeLabel(editingPayment.template.type)}
                </div>
              </Field>

              {editingPayment.template.type === 'installment' && (
                <>
                  <Field label="Total de cuotas">
                    <Input value={installmentTotal} onChange={event => setInstallmentTotal(event.target.value)} type="number" className="h-12 rounded-2xl border-border/70 bg-background/80" />
                  </Field>
                  <Field label="Cuotas pagadas">
                    <Input value={installmentPaid} onChange={event => setInstallmentPaid(event.target.value)} type="number" className="h-12 rounded-2xl border-border/70 bg-background/80" />
                  </Field>
                </>
              )}

              <div className="md:col-span-2">
                <Field label="Recordatorios">
                  <div className="flex flex-wrap gap-2">
                    {REMINDER_OPTIONS.map(option => {
                      const active = reminders.includes(option);

                      return (
                        <button
                          key={option}
                          onClick={() => toggleReminder(option)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            active
                              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15'
                              : 'bg-background/80 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              <Field label="Hora sugerida">
                <Input value={reminderTime} onChange={event => setReminderTime(event.target.value)} type="time" className="h-12 rounded-2xl border-border/70 bg-background/80" />
              </Field>

              <div className="md:col-span-2">
                <Field label="Notas">
                  <Textarea
                    value={notes}
                    onChange={event => setNotes(event.target.value)}
                    className="min-h-[120px] rounded-2xl border-border/70 bg-background/80"
                  />
                </Field>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 sm:gap-0">
            <button
              onClick={closeEditor}
              disabled={saving}
              className="rounded-[20px] bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-[20px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletePayment)} onOpenChange={open => { if (!open) setDeleteTemplateId(null); }}>
        <AlertDialogContent className="rounded-[28px] border-border/70 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar pago activo</AlertDialogTitle>
            <AlertDialogDescription>
              {deletePayment
                ? `Vas a eliminar "${deletePayment.template.name}" junto con sus registros relacionados. Esta accion no se puede deshacer.`
                : 'Esta accion no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-[20px] border-border/70 bg-background/80">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="rounded-[20px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
);

const InfoPill = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[22px] bg-background/80 px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
  </div>
);

const templateToReminderLabels = (template: { reminderDaysBefore?: number[]; reminderOnDueDate?: boolean }) => {
  const labels = (template.reminderDaysBefore ?? [])
    .slice()
    .sort((first, second) => second - first)
    .map(day => `${day} dia${day === 1 ? '' : 's'} antes`);

  if (template.reminderOnDueDate) {
    labels.push('El dia exacto');
  }

  return labels;
};

export default PaymentsPage;
