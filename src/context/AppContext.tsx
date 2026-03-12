import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_APP_SETTINGS } from '@/lib/app-settings';
import { useAuth } from '@/context/AuthContext';
import {
  createBackupSnapshot,
  createCategory,
  createPayment,
  markInstancePaid,
  removeCategory,
  removeTemplateWithInstances,
  skipInstance,
  subscribeToCategories,
  subscribeToInstances,
  subscribeToSettings,
  subscribeToTemplates,
  updateSettings,
  updateInstance,
  updateTemplate,
} from '@/services/firestore';
import type { AppSettings, Category, PaymentFrequency, PaymentInstance, PaymentTemplate, PaymentType } from '@/types';

interface AppState {
  categories: Category[];
  templates: PaymentTemplate[];
  instances: PaymentInstance[];
  settings: AppSettings;
}

interface AddPaymentInput {
  name: string;
  categoryId: string;
  amount: number;
  dueDate: string;
  type: PaymentType;
  frequency: PaymentFrequency;
  notes?: string;
  reminderDaysBefore?: number[];
  reminderOnDueDate?: boolean;
  reminderTime?: string;
  installmentTotal?: number;
  installmentPaid?: number;
}

interface UpdatePaymentInput {
  templateId: string;
  instanceId?: string;
  name: string;
  categoryId: string;
  amount: number;
  dueDate: string;
  frequency: PaymentFrequency;
  notes?: string;
  reminderDaysBefore?: number[];
  reminderOnDueDate?: boolean;
  reminderTime?: string;
  installmentTotal?: number;
  installmentPaid?: number;
}

interface AppContextValue {
  state: AppState;
  loading: boolean;
  error: string | null;
  addCategory: (category: Omit<Category, 'id'>) => { categoryId: string; commit: Promise<void> };
  deleteCategory: (categoryId: string) => Promise<void>;
  addPayment: (payment: AddPaymentInput) => { templateId: string; instanceId: string; commit: Promise<void> };
  updatePayment: (payment: UpdatePaymentInput) => Promise<void>;
  markPaid: (instanceId: string) => Promise<void>;
  skipPayment: (instanceId: string) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  setIncomeEstimate: (amount: number) => Promise<void>;
  updatePreferences: (settings: Partial<AppSettings>) => Promise<void>;
  createBackup: () => Promise<string>;
}

const emptyState: AppState = {
  categories: [],
  templates: [],
  instances: [],
  settings: DEFAULT_APP_SETTINGS,
};

const AppContext = createContext<AppContextValue | null>(null);

const createLoadingTracker = () => ({
  categories: false,
  templates: false,
  instances: false,
  settings: false,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AppState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.uid;

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!userId) {
      setState(emptyState);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const loaded = createLoadingTracker();
    const markLoaded = (key: keyof typeof loaded) => {
      loaded[key] = true;
      if (Object.values(loaded).every(Boolean)) {
        setLoading(false);
      }
    };

    const handleSnapshotError = (snapshotError: Error) => {
      console.error(snapshotError);
      setError('No se pudieron cargar tus datos en este momento.');
      setLoading(false);
    };

    const unsubscribers = [
      subscribeToCategories(
        userId,
        categories => {
          setState(current => ({ ...current, categories }));
          markLoaded('categories');
        },
        handleSnapshotError,
      ),
      subscribeToTemplates(
        userId,
        templates => {
          setState(current => ({ ...current, templates }));
          markLoaded('templates');
        },
        handleSnapshotError,
      ),
      subscribeToInstances(
        userId,
        instances => {
          setState(current => ({ ...current, instances }));
          markLoaded('instances');
        },
        handleSnapshotError,
      ),
      subscribeToSettings(
        userId,
        settings => {
          setState(current => ({ ...current, settings }));
          markLoaded('settings');
        },
        handleSnapshotError,
      ),
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [authLoading, userId]);

  const ensureUserId = () => {
    if (!user) throw new Error('Debes iniciar sesion para usar tus datos.');
    return user.uid;
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const userId = ensureUserId();
    return createCategory(userId, category);
  };

  const deleteCategory = async (categoryId: string) => {
    const userId = ensureUserId();
    const hasLinkedTemplates = state.templates.some(template => template.categoryId === categoryId);

    if (hasLinkedTemplates) {
      throw new Error('No puedes eliminar una categoria con pagos asociados.');
    }

    await removeCategory(userId, categoryId);
  };

  const addPayment = (payment: AddPaymentInput) => {
    const userId = ensureUserId();

    return createPayment(userId, {
      template: {
        name: payment.name.trim(),
        categoryId: payment.categoryId,
        type: payment.type,
        amount: payment.amount,
        currency: state.settings.currency,
        frequency: payment.frequency,
        startDate: payment.dueDate,
        active: true,
        notes: payment.notes?.trim() || undefined,
        reminderDaysBefore: payment.reminderDaysBefore,
        reminderOnDueDate: payment.reminderOnDueDate,
        reminderTime: payment.reminderTime,
        installmentTotal: payment.type === 'installment' ? payment.installmentTotal : undefined,
        installmentPaid: payment.type === 'installment' ? payment.installmentPaid : undefined,
      },
      instance: {
        dueDate: payment.dueDate,
        amount: payment.amount,
        status: 'pending',
        monthKey: payment.dueDate.slice(0, 7),
        notes: payment.notes?.trim() || undefined,
      },
    });
  };

  const markPaid = async (instanceId: string) => {
    const userId = ensureUserId();
    const instance = state.instances.find(item => item.id === instanceId);
    const template = instance ? state.templates.find(item => item.id === instance.templateId) : null;

    await markInstancePaid(userId, instanceId);

    if (template?.type === 'installment' && typeof template.installmentTotal === 'number') {
      await updateTemplate(userId, template.id, {
        installmentPaid: Math.min((template.installmentPaid || 0) + 1, template.installmentTotal),
      });
    }
  };

  const skipPayment = async (instanceId: string) => {
    const userId = ensureUserId();
    await skipInstance(userId, instanceId);
  };

  const updatePaymentData = async (payment: UpdatePaymentInput) => {
    const userId = ensureUserId();

    const template = state.templates.find(item => item.id === payment.templateId);
    if (!template) {
      throw new Error('No encontramos el pago que quieres editar.');
    }

    await updateTemplate(userId, payment.templateId, {
      name: payment.name.trim(),
      categoryId: payment.categoryId,
      amount: payment.amount,
      frequency: payment.frequency,
      startDate: payment.dueDate,
      notes: payment.notes?.trim() || undefined,
      reminderDaysBefore: payment.reminderDaysBefore,
      reminderOnDueDate: payment.reminderOnDueDate,
      reminderTime: payment.reminderTime,
      installmentTotal: template.type === 'installment' ? payment.installmentTotal : undefined,
      installmentPaid: template.type === 'installment' ? payment.installmentPaid : undefined,
    });

    if (payment.instanceId) {
      await updateInstance(userId, payment.instanceId, {
        dueDate: payment.dueDate,
        amount: payment.amount,
        monthKey: payment.dueDate.slice(0, 7),
        notes: payment.notes?.trim() || undefined,
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    const userId = ensureUserId();
    await removeTemplateWithInstances(userId, templateId);
  };

  const setIncomeEstimate = async (amount: number) => {
    const userId = ensureUserId();
    await updateSettings(userId, { incomeEstimate: amount });
  };

  const updatePreferences = async (settings: Partial<AppSettings>) => {
    const userId = ensureUserId();
    await updateSettings(userId, settings);
  };

  const createBackup = async () => {
    const userId = ensureUserId();
    return createBackupSnapshot(userId, {
      categories: state.categories,
      templates: state.templates,
      instances: state.instances,
      settings: state.settings,
    });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        loading,
        error,
        addCategory,
        deleteCategory,
        addPayment,
        updatePayment: updatePaymentData,
        markPaid,
        skipPayment,
        deleteTemplate,
        setIncomeEstimate,
        updatePreferences,
        createBackup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
