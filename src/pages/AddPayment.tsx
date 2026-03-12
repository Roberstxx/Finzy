import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Repeat, ShoppingBag } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getReminderChipOptions } from '@/lib/app-settings';
import { PaymentType, PaymentFrequency } from '@/types';
import { toast } from 'sonner';
import PageShell from '@/components/layout/PageShell';
import { formatCurrency, getTodayDateString } from '@/lib/formatters';

const STEP_META = [
  {
    title: 'Define el tipo de pago',
    description: 'Selecciona la estructura del movimiento para que la app lo organice mejor en escritorio y en futuras vistas.',
  },
  {
    title: 'Completa los detalles',
    description: 'Captura la informacion principal del pago con una distribucion mas amplia y ordenada.',
  },
  {
    title: 'Configura recordatorios',
    description: 'Deja listo el seguimiento basico antes de guardar el nuevo elemento.',
  },
];

const TYPE_OPTIONS = [
  { value: 'recurrent' as const, label: 'Recurrente', desc: 'Pagos que se repiten como internet o suscripciones.', icon: Repeat },
  { value: 'installment' as const, label: 'Cuotas', desc: 'Compras a meses con seguimiento de avance.', icon: CreditCard },
  { value: 'one_time' as const, label: 'Pago unico', desc: 'Un movimiento aislado sin repeticion.', icon: ShoppingBag },
];

const REMINDER_DAY_MAP: Record<string, number> = {
  '7 dias antes': 7,
  '3 dias antes': 3,
  '1 dia antes': 1,
};

const AddPayment = () => {
  const navigate = useNavigate();
  const { state, loading, addPayment } = useApp();
  const [step, setStep] = useState(0);

  const [type, setType] = useState<PaymentType>('recurrent');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly');
  const [installmentTotal, setInstallmentTotal] = useState('12');
  const [installmentPaid, setInstallmentPaid] = useState('0');
  const [notes, setNotes] = useState('');
  const [reminders, setReminders] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState(state.settings.defaultReminderTime);
  const [saving, setSaving] = useState(false);
  const [pendingInstanceId, setPendingInstanceId] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const defaultsAppliedRef = useRef(false);

  const reminderOptions = ['7 dias antes', '3 dias antes', '1 dia antes', 'El dia exacto'];
  const selectedCategory = state.categories.find(category => category.id === categoryId);
  const canContinueStep2 = name.trim() && Number(amount) > 0 && dueDate;

  useEffect(() => {
    if (!categoryId && state.categories.length > 0) {
      setCategoryId(state.categories[0].id);
    }
  }, [categoryId, state.categories]);

  useEffect(() => {
    if (loading || defaultsAppliedRef.current) return;

    setReminders(getReminderChipOptions(state.settings));
    setReminderTime(state.settings.defaultReminderTime);
    defaultsAppliedRef.current = true;
  }, [loading, state.settings]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!pendingInstanceId) return;

    const paymentSaved = state.instances.some(instance => instance.id === pendingInstanceId);
    if (!paymentSaved) return;

    setPendingInstanceId(null);
    setSaving(false);
    toast.success('Pago guardado correctamente');
    navigate('/', { replace: true });
  }, [navigate, pendingInstanceId, state.instances]);

  const toggleReminder = (reminder: string) => {
    setReminders(current => current.includes(reminder) ? current.filter(item => item !== reminder) : [...current, reminder]);
  };

  const handleSave = async () => {
    if (!categoryId || saving) {
      toast.error('Primero crea una categoria para guardar pagos.');
      return;
    }

    const trimmedName = name.trim();
    const parsedAmount = Number(amount);

    if (!trimmedName || parsedAmount <= 0 || !dueDate) {
      toast.error('Completa los datos principales antes de guardar.');
      return;
    }

    setSaving(true);

    try {
      const { instanceId, commit } = addPayment({
        name: trimmedName,
        categoryId,
        amount: parsedAmount,
        dueDate,
        type,
        frequency,
        notes,
        reminderDaysBefore: reminders.filter(reminder => reminder in REMINDER_DAY_MAP).map(reminder => REMINDER_DAY_MAP[reminder]),
        reminderOnDueDate: reminders.includes('El dia exacto'),
        reminderTime,
        installmentTotal: type === 'installment' ? Number(installmentTotal) : undefined,
        installmentPaid: type === 'installment' ? Number(installmentPaid) : undefined,
      });
      setPendingInstanceId(instanceId);

      void commit.catch(error => {
        const message = error instanceof Error ? error.message : 'No se pudo guardar el pago.';

        if (isMountedRef.current) {
          setPendingInstanceId(current => current === instanceId ? null : current);
          setSaving(false);
        }

        toast.error(message);
      });
    } catch (error) {
      setSaving(false);
      const message = error instanceof Error ? error.message : 'No se pudo guardar el pago.';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <PageShell className="mx-auto max-w-[1280px]">
        <div className="page-surface flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Preparando tus datos...</p>
              <p className="text-sm text-muted-foreground">Estamos dejando lista tu informacion.</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (state.categories.length === 0) {
    return (
      <PageShell className="mx-auto max-w-[960px]">
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card"
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          <div className="page-surface flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
            <p className="page-section-label">Sin categorias</p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">Primero crea tus categorias</h1>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Primero registra al menos una categoria para empezar a organizar tus pagos y mantener todo ordenado desde el inicio.
            </p>
            <button
              onClick={() => navigate('/categories', { state: { openCreate: true, returnTo: '/add-payment' } })}
              className="mt-6 rounded-[22px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:translate-y-[-1px]"
            >
              Crear mi primera categoria
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="mx-auto max-w-[1280px]">
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card"
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          <div className="page-surface p-5 xl:sticky xl:top-8">
            <p className="page-section-label">Nuevo pago</p>
            <h1 className="mt-3 text-2xl font-semibold text-foreground">{STEP_META[step].title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{STEP_META[step].description}</p>

            <div className="mt-6 space-y-3">
              {STEP_META.map((item, index) => (
                <div key={item.title} className={`rounded-[22px] border px-4 py-3 ${index === step ? 'border-primary bg-primary/8' : 'border-border/70 bg-background/70'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${index <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{index === 0 ? 'Tipo' : index === 1 ? 'Detalles' : 'Recordatorios'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Resumen rapido</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{name || 'Nuevo pago'}</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>Tipo: {TYPE_OPTIONS.find(option => option.value === type)?.label}</p>
                <p>Categoria: {selectedCategory?.name || 'Sin categoria'}</p>
                <p>Monto: {amount ? formatCurrency(Number(amount), state.settings.currency) : '--'}</p>
                <p>Vence: {dueDate || '--'}</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="page-surface p-6 md:p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <p className="page-section-label">Paso 1</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Elige como quieres registrarlo</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {TYPE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setType(option.value)}
                    className={`rounded-[28px] border p-5 text-left transition-all ${
                      type === option.value
                        ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15'
                        : 'border-border/70 bg-background/80 text-foreground hover:bg-background'
                    }`}
                  >
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${type === option.value ? 'bg-white/15' : 'bg-primary/10 text-primary'}`}>
                      <option.icon size={22} />
                    </span>
                    <p className="mt-5 text-lg font-semibold">{option.label}</p>
                    <p className={`mt-2 text-sm ${type === option.value ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{option.desc}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-[22px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:translate-y-[-1px]"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="page-section-label">Paso 2</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Detalles del pago</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre" value={name} onChange={setName} placeholder="Ej. Internet o renta" />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Categoria</label>
                  <select
                    value={categoryId}
                    onChange={event => setCategoryId(event.target.value)}
                    className="w-full rounded-2xl border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    {state.categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Field label={`Monto (${state.settings.currency})`} value={amount} onChange={setAmount} placeholder="0.00" type="number" />
                <Field label="Primer vencimiento" value={dueDate} onChange={setDueDate} type="date" />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Frecuencia</label>
                  <select
                    value={frequency}
                    onChange={event => setFrequency(event.target.value as PaymentFrequency)}
                    className="w-full rounded-2xl border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    {['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'].map(option => (
                      <option key={option} value={option}>
                        {{ weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual', quarterly: 'Trimestral', yearly: 'Anual' }[option]}
                      </option>
                    ))}
                  </select>
                </div>

                {type === 'installment' && (
                  <>
                    <Field label="Total de cuotas" value={installmentTotal} onChange={setInstallmentTotal} placeholder="12" type="number" />
                    <Field label="Cuotas pagadas" value={installmentPaid} onChange={setInstallmentPaid} placeholder="0" type="number" />
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Notas</label>
                  <textarea
                    value={notes}
                    onChange={event => setNotes(event.target.value)}
                    placeholder="Detalles sobre como se paga, referencias o anotaciones."
                    className="min-h-[120px] w-full resize-none rounded-2xl border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setStep(0)}
                  className="rounded-[22px] bg-muted px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Regresar
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canContinueStep2}
                  className="rounded-[22px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="page-section-label">Paso 3</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Define recordatorios</h2>
              </div>

              <div className="rounded-[28px] bg-background/80 p-5">
                <label className="block text-sm font-medium text-foreground">Cuando recordar</label>
                <div className="mt-4 flex flex-wrap gap-2">
                  {reminderOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => toggleReminder(option)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        reminders.includes(option)
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15'
                          : 'bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Hora sugerida" value={reminderTime} onChange={setReminderTime} type="time" />
                <div className="rounded-[24px] bg-background/80 p-4">
                  <p className="text-sm text-muted-foreground">Resumen final</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{name || 'Nuevo pago'}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{amount ? formatCurrency(Number(amount), state.settings.currency) : '--'} - {selectedCategory?.name || 'Sin categoria'}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-[22px] bg-muted px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Regresar
                </button>
                <button
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-[22px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar pago'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
};

const Field = ({ label, value, onChange, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
    <input
      type={type}
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
    />
  </div>
);

export default AddPayment;
