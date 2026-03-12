import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Download, ListChecks, Monitor, Moon, Palette, Sun, WalletCards } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import {
  REMINDER_DAY_CHOICES,
  SUPPORTED_CURRENCIES,
  getMonthStartLabel,
  getReminderSummaryFromSettings,
} from '@/lib/app-settings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PageHeader from '@/components/layout/PageHeader';
import PageShell from '@/components/layout/PageShell';

type SettingsEditor = 'reminder-default' | 'reminder-time' | 'currency' | 'month-start' | null;

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { state, updatePreferences, createBackup } = useApp();
  const [activeEditor, setActiveEditor] = useState<SettingsEditor>(null);
  const [savingEditor, setSavingEditor] = useState<SettingsEditor | null>(null);
  const [runningAction, setRunningAction] = useState<'export' | 'backup' | null>(null);
  const [draftReminderDays, setDraftReminderDays] = useState<number[]>(state.settings.defaultReminderDaysBefore);
  const [draftReminderOnDueDate, setDraftReminderOnDueDate] = useState(state.settings.defaultReminderOnDueDate);
  const [draftReminderTime, setDraftReminderTime] = useState(state.settings.defaultReminderTime);
  const [draftCurrency, setDraftCurrency] = useState(state.settings.currency);
  const [draftMonthStartDay, setDraftMonthStartDay] = useState(String(state.settings.monthStartDay));

  const themeLabel = theme === 'dark' ? 'Oscuro' : theme === 'light' ? 'Claro' : 'Sistema';
  const reminderSummary = getReminderSummaryFromSettings(state.settings);
  const lastBackupLabel = state.settings.lastBackupAt ? formatBackupLabel(state.settings.lastBackupAt) : 'Crear ahora';

  const openEditor = (editor: Exclude<SettingsEditor, null>) => {
    setDraftReminderDays(state.settings.defaultReminderDaysBefore);
    setDraftReminderOnDueDate(state.settings.defaultReminderOnDueDate);
    setDraftReminderTime(state.settings.defaultReminderTime);
    setDraftCurrency(state.settings.currency);
    setDraftMonthStartDay(String(state.settings.monthStartDay));
    setActiveEditor(editor);
  };

  const toggleReminderDay = (day: number) => {
    setDraftReminderDays(current =>
      current.includes(day)
        ? current.filter(item => item !== day)
        : [...current, day].sort((first, second) => second - first),
    );
  };

  const handleSaveReminderDefaults = async () => {
    if (savingEditor) return;

    if (draftReminderDays.length === 0 && !draftReminderOnDueDate) {
      toast.error('Selecciona al menos un momento para recordar.');
      return;
    }

    setSavingEditor('reminder-default');

    try {
      await updatePreferences({
        defaultReminderDaysBefore: draftReminderDays,
        defaultReminderOnDueDate: draftReminderOnDueDate,
      });
      setActiveEditor(null);
      toast.success('Recordatorio por defecto actualizado.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el recordatorio por defecto.';
      toast.error(message);
    } finally {
      setSavingEditor(null);
    }
  };

  const handleSaveReminderTime = async () => {
    if (savingEditor) return;

    if (!/^\d{2}:\d{2}$/.test(draftReminderTime)) {
      toast.error('Ingresa una hora valida.');
      return;
    }

    setSavingEditor('reminder-time');

    try {
      await updatePreferences({ defaultReminderTime: draftReminderTime });
      setActiveEditor(null);
      toast.success('Hora de recordatorio actualizada.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la hora de recordatorio.';
      toast.error(message);
    } finally {
      setSavingEditor(null);
    }
  };

  const handleSaveCurrency = async () => {
    if (savingEditor) return;

    setSavingEditor('currency');

    try {
      await updatePreferences({ currency: draftCurrency });
      setActiveEditor(null);
      toast.success('Moneda por defecto actualizada.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la moneda.';
      toast.error(message);
    } finally {
      setSavingEditor(null);
    }
  };

  const handleSaveMonthStart = async () => {
    if (savingEditor) return;

    const numericDay = Number(draftMonthStartDay);
    if (!Number.isInteger(numericDay) || numericDay < 1 || numericDay > 28) {
      toast.error('El inicio de mes debe estar entre el dia 1 y el 28.');
      return;
    }

    setSavingEditor('month-start');

    try {
      await updatePreferences({ monthStartDay: numericDay });
      setActiveEditor(null);
      toast.success('Inicio de mes actualizado.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el inicio de mes.';
      toast.error(message);
    } finally {
      setSavingEditor(null);
    }
  };

  const handleExport = async () => {
    if (runningAction) return;

    setRunningAction('export');

    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        app: 'Finzy',
        version: 1,
        data: {
          categories: state.categories,
          templates: state.templates,
          instances: state.instances,
          settings: state.settings,
        },
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finzy-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Tus datos se exportaron en un archivo JSON.');
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron exportar tus datos.');
    } finally {
      setRunningAction(null);
    }
  };

  const handleBackup = async () => {
    if (runningAction) return;

    setRunningAction('backup');

    try {
      await createBackup();
      toast.success('Respaldo guardado correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el respaldo.';
      toast.error(message);
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <PageShell className="space-y-8">
      <PageHeader
        eyebrow="Configuracion"
        title="Ajustes de la app"
        subtitle="Ahora si puedes editar recordatorios, moneda, ciclo mensual y acciones de datos desde un centro de control funcional."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <div className="page-surface p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Palette size={20} />
              </span>
              <div>
                <p className="page-section-label">Apariencia</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Tema actual: {themeLabel}</h2>
                <p className="mt-2 text-sm text-muted-foreground">Ajusta rapidamente la apariencia general y conserva una experiencia consistente en web y acceso directo.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {([
                { key: 'light', label: 'Claro', icon: Sun },
                { key: 'dark', label: 'Oscuro', icon: Moon },
                { key: 'system', label: 'Sistema', icon: Monitor },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`rounded-[24px] border p-4 text-left transition-all ${
                    theme === key
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15'
                      : 'border-border/70 bg-background/80 text-foreground hover:bg-background'
                  }`}
                >
                  <Icon size={18} />
                  <p className="mt-4 font-semibold">{label}</p>
                  <p className={`mt-1 text-sm ${theme === key ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {key === 'system' ? 'Respeta el sistema operativo' : `Usa modo ${label.toLowerCase()}`}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="page-surface p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground">
                <Bell size={20} />
              </span>
              <div>
                <p className="page-section-label">Aplicado</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Tus pagos toman estos valores</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  La moneda y los recordatorios base ya se usan al registrar pagos nuevos, y el inicio de mes afecta los paneles mensuales.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Categorias" icon={<WalletCards size={18} className="text-primary" />}>
            <SettingsRow label="Gestionar categorias" value="" onTap={() => navigate('/categories')} />
          </Section>

          <Section title="Pagos" icon={<ListChecks size={18} className="text-primary" />}>
            <SettingsRow label="Gestionar pagos activos" value="Editar y eliminar" onTap={() => navigate('/payments')} />
          </Section>

          <Section title="Recordatorios" icon={<Bell size={18} className="text-primary" />}>
            <SettingsRow label="Recordatorio por defecto" value={reminderSummary} onTap={() => openEditor('reminder-default')} />
            <SettingsRow label="Hora de recordatorio" value={state.settings.defaultReminderTime} onTap={() => openEditor('reminder-time')} />
          </Section>

          <Section title="Preferencias" icon={<Palette size={18} className="text-primary" />}>
            <SettingsRow label="Moneda" value={state.settings.currency} onTap={() => openEditor('currency')} />
            <SettingsRow label="Inicio de mes" value={getMonthStartLabel(state.settings.monthStartDay)} onTap={() => openEditor('month-start')} />
          </Section>

          <Section title="Datos" icon={<Download size={18} className="text-primary" />}>
            <SettingsRow
              label="Exportar datos"
              value={runningAction === 'export' ? 'Exportando...' : 'JSON'}
              onTap={() => void handleExport()}
              disabled={runningAction !== null}
            />
            <SettingsRow
              label="Respaldo"
              value={runningAction === 'backup' ? 'Guardando...' : lastBackupLabel}
              onTap={() => void handleBackup()}
              disabled={runningAction !== null}
            />
          </Section>
        </div>
      </section>

      <Dialog open={activeEditor === 'reminder-default'} onOpenChange={open => setActiveEditor(open ? 'reminder-default' : null)}>
        <DialogContent className="rounded-[28px] border-border/70 bg-card sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Recordatorio por defecto</DialogTitle>
            <DialogDescription>Selecciona los momentos que se prellenan cuando registras un pago nuevo.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {REMINDER_DAY_CHOICES.map(day => {
              const active = draftReminderDays.includes(day);

              return (
                <button
                  key={day}
                  onClick={() => toggleReminderDay(day)}
                  className={`rounded-[22px] border px-4 py-3 text-left transition-all ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15'
                      : 'border-border/70 bg-background/80 text-foreground hover:bg-background'
                  }`}
                >
                  <p className="font-semibold">{day} dia{day === 1 ? '' : 's'} antes</p>
                  <p className={`mt-1 text-sm ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>Quedara marcado por defecto</p>
                </button>
              );
            })}

            <button
              onClick={() => setDraftReminderOnDueDate(current => !current)}
              className={`rounded-[22px] border px-4 py-3 text-left transition-all ${
                draftReminderOnDueDate
                  ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15'
                  : 'border-border/70 bg-background/80 text-foreground hover:bg-background'
              }`}
            >
              <p className="font-semibold">El dia exacto</p>
              <p className={`mt-1 text-sm ${draftReminderOnDueDate ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>Activa un aviso el mismo dia de vencimiento</p>
            </button>
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <button
              onClick={() => setActiveEditor(null)}
              className="rounded-[20px] bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleSaveReminderDefaults()}
              disabled={savingEditor === 'reminder-default'}
              className="rounded-[20px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingEditor === 'reminder-default' ? 'Guardando...' : 'Guardar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activeEditor === 'reminder-time'} onOpenChange={open => setActiveEditor(open ? 'reminder-time' : null)}>
        <DialogContent className="rounded-[28px] border-border/70 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hora de recordatorio</DialogTitle>
            <DialogDescription>Se usara como hora sugerida al crear pagos nuevos.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Hora base</label>
            <input
              type="time"
              value={draftReminderTime}
              onChange={event => setDraftReminderTime(event.target.value)}
              className="w-full rounded-2xl border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
            />
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <button
              onClick={() => setActiveEditor(null)}
              className="rounded-[20px] bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleSaveReminderTime()}
              disabled={savingEditor === 'reminder-time'}
              className="rounded-[20px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingEditor === 'reminder-time' ? 'Guardando...' : 'Guardar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activeEditor === 'currency'} onOpenChange={open => setActiveEditor(open ? 'currency' : null)}>
        <DialogContent className="rounded-[28px] border-border/70 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Moneda por defecto</DialogTitle>
            <DialogDescription>Se aplicara en nuevos pagos y en los paneles generales de la app.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Moneda</label>
            <select
              value={draftCurrency}
              onChange={event => setDraftCurrency(event.target.value)}
              className="w-full rounded-2xl border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
            >
              {SUPPORTED_CURRENCIES.map(currency => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <button
              onClick={() => setActiveEditor(null)}
              className="rounded-[20px] bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleSaveCurrency()}
              disabled={savingEditor === 'currency'}
              className="rounded-[20px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingEditor === 'currency' ? 'Guardando...' : 'Guardar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activeEditor === 'month-start'} onOpenChange={open => setActiveEditor(open ? 'month-start' : null)}>
        <DialogContent className="rounded-[28px] border-border/70 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inicio de mes</DialogTitle>
            <DialogDescription>Define desde que dia arranca tu ciclo mensual para el dashboard, el sidebar y la vista del mes.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Dia de inicio</label>
            <select
              value={draftMonthStartDay}
              onChange={event => setDraftMonthStartDay(event.target.value)}
              className="w-full rounded-2xl border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
            >
              {Array.from({ length: 28 }, (_, index) => index + 1).map(day => (
                <option key={day} value={day}>
                  {getMonthStartLabel(day)}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <button
              onClick={() => setActiveEditor(null)}
              className="rounded-[20px] bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleSaveMonthStart()}
              disabled={savingEditor === 'month-start'}
              className="rounded-[20px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingEditor === 'month-start' ? 'Guardando...' : 'Guardar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

const Section = ({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) => (
  <div className="page-surface overflow-hidden">
    <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">{icon}</span>
      <div>
        <p className="page-section-label">Bloque</p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">{title}</h2>
      </div>
    </div>
    <div className="divide-y divide-border/60">{children}</div>
  </div>
);

const SettingsRow = ({
  label,
  value,
  onTap,
  disabled = false,
}: {
  label: string;
  value?: string;
  onTap: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onTap}
    disabled={disabled}
    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-background/80 disabled:cursor-not-allowed disabled:opacity-60"
  >
    <span className="text-sm font-medium text-card-foreground">{label}</span>
    <div className="flex items-center gap-2 text-muted-foreground">
      {value && <span className="text-sm">{value}</span>}
      <ChevronRight size={16} />
    </div>
  </button>
);

const formatBackupLabel = (value: string) =>
  new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export default SettingsPage;
