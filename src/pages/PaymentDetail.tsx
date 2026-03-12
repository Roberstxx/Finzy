import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, SkipForward, Archive, Trash2, PencilLine } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatFullDate, formatShortDate, getDisplayStatus, getFrequencyLabel, getReminderSummary, getTypeLabel } from '@/lib/formatters';
import CategoryIcon from '@/components/CategoryIcon';
import StatusBadge from '@/components/StatusBadge';
import { toast } from 'sonner';
import PageShell from '@/components/layout/PageShell';

const PaymentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, loading, markPaid, skipPayment, deleteTemplate } = useApp();
  const [busyAction, setBusyAction] = useState<'paid' | 'skipped' | 'delete' | null>(null);

  const instance = state.instances.find(item => item.id === id);
  const template = instance ? state.templates.find(item => item.id === instance.templateId) : null;
  const category = template ? state.categories.find(item => item.id === template.categoryId) : null;

  if (loading) {
    return (
      <PageShell className="mx-auto flex min-h-[70vh] max-w-[960px] items-center justify-center">
        <div className="page-surface flex h-48 w-full max-w-md items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Preparando tus datos...</p>
              <p className="text-sm text-muted-foreground">Cargando el detalle del pago.</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!instance || !template) {
    return (
      <PageShell className="mx-auto flex min-h-[70vh] max-w-[960px] items-center justify-center">
        <div className="page-surface px-6 py-10 text-center">
          <p className="text-muted-foreground">Pago no encontrado.</p>
        </div>
      </PageShell>
    );
  }

  const relatedInstances = state.instances
    .filter(item => item.templateId === template.id && item.id !== instance.id && (item.status === 'paid' || item.status === 'skipped'))
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
    .slice(0, 5);

  const displayStatus = getDisplayStatus(instance);
  const isDone = displayStatus === 'paid' || displayStatus === 'skipped';

  const handleMarkPaid = async () => {
    if (busyAction) return;

    setBusyAction('paid');

    try {
      await markPaid(instance.id);
      toast.success('Marcado como pagado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el pago.';
      toast.error(message);
    } finally {
      setBusyAction(current => current === 'paid' ? null : current);
    }
  };

  const handleSkip = async () => {
    if (busyAction) return;

    setBusyAction('skipped');

    try {
      await skipPayment(instance.id);
      toast.success('Pago saltado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo saltar el pago.';
      toast.error(message);
    } finally {
      setBusyAction(current => current === 'skipped' ? null : current);
    }
  };

  const handleDelete = async () => {
    if (busyAction) return;

    setBusyAction('delete');

    try {
      await deleteTemplate(template.id);
      toast.success('Pago eliminado');
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el pago.';
      toast.error(message);
      setBusyAction(null);
    }
  };

  return (
    <PageShell className="mx-auto max-w-[1320px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-card/80 text-foreground transition-colors hover:bg-card"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="page-section-label">Detalle</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">{template.name}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate(`/payments?edit=${template.id}`)}
            className="inline-flex items-center gap-2 rounded-[20px] bg-background/80 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            <PencilLine size={16} />
            Editar
          </button>
          <StatusBadge status={displayStatus} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <div className="space-y-6">
          <div className="page-surface p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-4">
                {category && <CategoryIcon icon={category.icon} categoryId={category.id} className="h-14 w-14 rounded-[20px]" />}
                <div>
                  <p className="page-section-label">Pago</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{template.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{category?.name || 'Sin categoria'}</p>
                </div>
              </div>

              <div className="rounded-[24px] bg-background/80 px-5 py-4 text-left lg:text-right">
                <p className="text-sm text-muted-foreground">Monto</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{formatCurrency(instance.amount, template.currency)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Vence el {formatFullDate(instance.dueDate)}</p>
              </div>
            </div>

            {!isDone && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => void handleMarkPaid()}
                  disabled={busyAction !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-status-paid/15 px-5 py-3 text-sm font-semibold text-status-paid transition-colors hover:bg-status-paid/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check size={18} />
                  Marcar pagado
                </button>
                <button
                  onClick={() => void handleSkip()}
                  disabled={busyAction !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-muted px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SkipForward size={18} />
                  Saltar pago
                </button>
              </div>
            )}
          </div>

          <div className="page-surface overflow-hidden">
            <div className="border-b border-border/60 px-6 py-4">
              <p className="page-section-label">Configuracion</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Datos del pago</h2>
            </div>
            <div className="divide-y divide-border/60">
              <InfoRow label="Tipo" value={getTypeLabel(template.type)} />
              <InfoRow label="Frecuencia" value={getFrequencyLabel(template.frequency)} />
              {template.type === 'installment' && <InfoRow label="Progreso" value={`${template.installmentPaid}/${template.installmentTotal} cuotas`} />}
              <InfoRow label="Recordatorios" value={getReminderSummary(template)} />
              {template.notes && <InfoRow label="Notas" value={template.notes} />}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {relatedInstances.length > 0 && (
            <div className="page-surface overflow-hidden">
              <div className="border-b border-border/60 px-6 py-4">
                <p className="page-section-label">Historial</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Ultimos movimientos</h2>
              </div>
              <div className="divide-y divide-border/60">
                {relatedInstances.map(related => (
                  <div key={related.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div>
                      <p className="font-medium text-card-foreground">{formatShortDate(related.dueDate)}</p>
                      <p className="text-sm text-muted-foreground">Registro previo del mismo pago</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-card-foreground">{formatCurrency(related.amount, template.currency)}</p>
                      <div className="mt-2">
                        <StatusBadge status={related.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="page-surface overflow-hidden">
            <div className="border-b border-border/60 px-6 py-4">
              <p className="page-section-label">Acciones</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Zona sensible</h2>
            </div>
            <div className="divide-y divide-border/60">
              <button
                disabled
                className="flex w-full items-center gap-3 px-6 py-4 text-left text-muted-foreground opacity-70"
              >
                <Archive size={18} />
                <span className="text-sm font-medium">Pausar o archivar</span>
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={busyAction !== null}
                className="flex w-full items-center gap-3 px-6 py-4 text-left text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={18} />
                <span className="text-sm font-medium">Eliminar pago</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 px-6 py-4">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-right text-sm font-medium text-card-foreground">{value}</span>
  </div>
);

export default PaymentDetail;
