import type { AppSettings } from '@/types';

const pad = (value: number) => String(value).padStart(2, '0');

export const SUPPORTED_CURRENCIES = ['MXN', 'USD', 'EUR'] as const;
export const REMINDER_DAY_CHOICES = [7, 3, 1] as const;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  incomeEstimate: 0,
  defaultReminderDaysBefore: [3],
  defaultReminderOnDueDate: true,
  defaultReminderTime: '09:00',
  currency: 'MXN',
  monthStartDay: 1,
};

export const normalizeReminderDaysBefore = (value: unknown) => {
  if (!Array.isArray(value)) {
    return DEFAULT_APP_SETTINGS.defaultReminderDaysBefore;
  }

  const days = value
    .filter((day): day is number => typeof day === 'number' && REMINDER_DAY_CHOICES.includes(day as (typeof REMINDER_DAY_CHOICES)[number]))
    .sort((first, second) => second - first);

  return days.length > 0 ? days : [];
};

export const normalizeAppSettings = (value?: Partial<AppSettings>): AppSettings => {
  const currency = typeof value?.currency === 'string' && SUPPORTED_CURRENCIES.includes(value.currency as (typeof SUPPORTED_CURRENCIES)[number])
    ? value.currency
    : DEFAULT_APP_SETTINGS.currency;
  const monthStartDay = typeof value?.monthStartDay === 'number'
    ? Math.min(28, Math.max(1, Math.round(value.monthStartDay)))
    : DEFAULT_APP_SETTINGS.monthStartDay;
  const reminderTime = typeof value?.defaultReminderTime === 'string' && /^\d{2}:\d{2}$/.test(value.defaultReminderTime)
    ? value.defaultReminderTime
    : DEFAULT_APP_SETTINGS.defaultReminderTime;

  return {
    incomeEstimate: typeof value?.incomeEstimate === 'number' ? value.incomeEstimate : DEFAULT_APP_SETTINGS.incomeEstimate,
    defaultReminderDaysBefore: normalizeReminderDaysBefore(value?.defaultReminderDaysBefore),
    defaultReminderOnDueDate: typeof value?.defaultReminderOnDueDate === 'boolean'
      ? value.defaultReminderOnDueDate
      : DEFAULT_APP_SETTINGS.defaultReminderOnDueDate,
    defaultReminderTime: reminderTime,
    currency,
    monthStartDay,
    lastBackupAt: typeof value?.lastBackupAt === 'string' ? value.lastBackupAt : undefined,
  };
};

export const getReminderLabelsFromSettings = (settings: Pick<AppSettings, 'defaultReminderDaysBefore' | 'defaultReminderOnDueDate'>) => {
  const labels = [...settings.defaultReminderDaysBefore]
    .sort((first, second) => second - first)
    .map(day => `${day} dia${day === 1 ? '' : 's'} antes`);

  if (settings.defaultReminderOnDueDate) {
    labels.push('el dia');
  }

  return labels;
};

export const getReminderSummaryFromSettings = (
  settings: Pick<AppSettings, 'defaultReminderDaysBefore' | 'defaultReminderOnDueDate'>,
) => {
  const labels = getReminderLabelsFromSettings(settings);
  return labels.length > 0 ? labels.join(' + ') : 'Sin recordatorio base';
};

export const getReminderChipOptions = (
  settings: Pick<AppSettings, 'defaultReminderDaysBefore' | 'defaultReminderOnDueDate'>,
) => {
  const selected = new Set(settings.defaultReminderDaysBefore.map(day => `${day} dias antes`));
  if (settings.defaultReminderDaysBefore.includes(1)) {
    selected.delete('1 dias antes');
    selected.add('1 dia antes');
  }
  if (settings.defaultReminderOnDueDate) {
    selected.add('El dia exacto');
  }

  return Array.from(selected);
};

export const getMonthStartLabel = (day: number) => `Dia ${day}`;

export const getCycleMonthKey = (value: Date | string, monthStartDay: number) => {
  const date = typeof value === 'string'
    ? new Date(`${value}T00:00:00`)
    : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const normalizedStartDay = Math.min(28, Math.max(1, monthStartDay));

  if (date.getDate() < normalizedStartDay) {
    date.setMonth(date.getMonth() - 1);
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};

export const getCurrentCycleMonthKey = (monthStartDay: number, baseDate = new Date()) =>
  getCycleMonthKey(baseDate, monthStartDay);
