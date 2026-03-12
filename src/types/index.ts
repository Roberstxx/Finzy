export type PaymentType = 'recurrent' | 'installment' | 'one_time';
export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'skipped';

export interface Category {
  id: string;
  name: string;
  icon: string;
  colorToken?: string;
  order?: number;
}

export interface PaymentTemplate {
  id: string;
  name: string;
  categoryId: string;
  type: PaymentType;
  amount: number;
  currency: string;
  frequency: PaymentFrequency;
  startDate: string;
  endDate?: string;
  reminderDaysBefore?: number[];
  reminderOnDueDate?: boolean;
  reminderTime?: string;
  notes?: string;
  active: boolean;
  installmentTotal?: number;
  installmentPaid?: number;
}

export interface PaymentInstance {
  id: string;
  templateId: string;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  monthKey: string;
  notes?: string;
}

export interface MonthlySummary {
  monthKey: string;
  totalSpent: number;
  fixedTotal: number;
  installmentsTotal: number;
  oneTimeTotal: number;
  byCategory: { categoryId: string; total: number }[];
  incomeEstimate: number;
}

export interface AppSettings {
  incomeEstimate: number;
  defaultReminderDaysBefore: number[];
  defaultReminderOnDueDate: boolean;
  defaultReminderTime: string;
  currency: string;
  monthStartDay: number;
  lastBackupAt?: string;
}
