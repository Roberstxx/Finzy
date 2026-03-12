import { PaymentInstance, PaymentStatus, PaymentTemplate } from '@/types';

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const pad = (value: number) => String(value).padStart(2, '0');

export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatFullDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return `${date.getDate()} ${MONTHS_FULL[date.getMonth()]} ${date.getFullYear()}`;
}

export function getTodayDateString(baseDate = new Date()): string {
  return `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}`;
}

export function toMonthKey(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 7);
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}`;
}

export function getCurrentMonthKey(baseDate = new Date()): string {
  return toMonthKey(baseDate);
}

export function shiftMonthKey(monthKey: string, months: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return toMonthKey(date);
}

export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${MONTHS_FULL[parseInt(month, 10) - 1]} ${year}`;
}

export function getDaysUntil(dateStr: string, fromDateStr = getTodayDateString()): number {
  const dueDate = new Date(`${dateStr}T00:00:00`);
  const fromDate = new Date(`${fromDateStr}T00:00:00`);
  return Math.ceil((dueDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDisplayStatus(instance: PaymentInstance): PaymentStatus {
  if (instance.status !== 'pending') return instance.status;
  return getDaysUntil(instance.dueDate) < 0 ? 'overdue' : 'pending';
}

export function getBadgeText(instance: PaymentInstance, template: PaymentTemplate): string {
  const displayStatus = getDisplayStatus(instance);
  if (displayStatus === 'paid') return 'Pagado';
  if (displayStatus === 'skipped') return 'Saltado';
  if (displayStatus === 'overdue') return 'Vencido';
  if (template.type === 'installment') return `Cuota ${(template.installmentPaid || 0) + 1}/${template.installmentTotal}`;

  const days = getDaysUntil(instance.dueDate);
  if (days < 0) return 'Vencido';
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Manana';
  if (days <= 3) return `En ${days} dias`;
  if (days <= 7) return 'Proximo';
  return 'Este mes';
}

export function getReminderSummary(template: PaymentTemplate): string {
  const parts: string[] = [];

  if (template.reminderDaysBefore?.length) {
    const days = [...template.reminderDaysBefore].sort((first, second) => second - first);
    parts.push(...days.map(day => `${day} dia${day === 1 ? '' : 's'} antes`));
  }

  if (template.reminderOnDueDate) {
    parts.push('El dia');
  }

  if (template.reminderTime) {
    parts.push(template.reminderTime);
  }

  return parts.length > 0 ? parts.join(' + ') : 'Sin recordatorios';
}

export function getFrequencyLabel(freq: string): string {
  const map: Record<string, string> = {
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual',
  };
  return map[freq] || freq;
}

export function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    recurrent: 'Recurrente',
    installment: 'Cuotas (a meses)',
    one_time: 'Pago unico',
  };
  return map[type] || type;
}
