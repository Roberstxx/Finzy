import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_APP_SETTINGS, normalizeAppSettings } from '@/lib/app-settings';
import type { AppSettings, Category, PaymentInstance, PaymentTemplate } from '@/types';

type SnapshotErrorHandler = (error: Error) => void;

interface CreatePaymentPayload {
  template: Omit<PaymentTemplate, 'id'>;
  instance: Omit<PaymentInstance, 'id' | 'templateId'>;
}

interface CategoryWriteOperation {
  categoryId: string;
  commit: Promise<void>;
}

interface PaymentWriteOperation {
  templateId: string;
  instanceId: string;
  commit: Promise<void>;
}

interface BackupPayload {
  categories: Category[];
  templates: PaymentTemplate[];
  instances: PaymentInstance[];
  settings: AppSettings;
}

const userCollection = (userId: string, collectionName: string) =>
  collection(db, 'users', userId, collectionName);

const settingsRef = (userId: string) =>
  doc(db, 'users', userId, 'settings', 'preferences');

const compactObject = <T extends Record<string, unknown>>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, currentValue]) => currentValue !== undefined)) as T;

const removeUndefinedDeep = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(item => removeUndefinedDeep(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, currentValue]) => currentValue !== undefined)
        .map(([key, currentValue]) => [key, removeUndefinedDeep(currentValue)]),
    ) as T;
  }

  return value;
};

const sortCategories = (categories: Category[]) =>
  [...categories].sort((first, second) => {
    const firstOrder = first.order ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = second.order ?? Number.MAX_SAFE_INTEGER;
    if (firstOrder !== secondOrder) return firstOrder - secondOrder;
    return first.name.localeCompare(second.name);
  });

const sortTemplates = (templates: PaymentTemplate[]) =>
  [...templates].sort((first, second) => first.name.localeCompare(second.name));

const sortInstances = (instances: PaymentInstance[]) =>
  [...instances].sort((first, second) => first.dueDate.localeCompare(second.dueDate));

export const subscribeToCategories = (
  userId: string,
  onNext: (categories: Category[]) => void,
  onError: SnapshotErrorHandler,
): Unsubscribe =>
  onSnapshot(
    userCollection(userId, 'categories'),
    snapshot => {
      const categories = snapshot.docs.map(documentSnapshot => ({
        id: documentSnapshot.id,
        ...(documentSnapshot.data() as Omit<Category, 'id'>),
      }));

      onNext(sortCategories(categories));
    },
    error => onError(error),
  );

export const subscribeToTemplates = (
  userId: string,
  onNext: (templates: PaymentTemplate[]) => void,
  onError: SnapshotErrorHandler,
): Unsubscribe =>
  onSnapshot(
    userCollection(userId, 'templates'),
    snapshot => {
      const templates = snapshot.docs.map(documentSnapshot => ({
        id: documentSnapshot.id,
        ...(documentSnapshot.data() as Omit<PaymentTemplate, 'id'>),
      }));

      onNext(sortTemplates(templates));
    },
    error => onError(error),
  );

export const subscribeToInstances = (
  userId: string,
  onNext: (instances: PaymentInstance[]) => void,
  onError: SnapshotErrorHandler,
): Unsubscribe =>
  onSnapshot(
    userCollection(userId, 'instances'),
    snapshot => {
      const instances = snapshot.docs.map(documentSnapshot => ({
        id: documentSnapshot.id,
        ...(documentSnapshot.data() as Omit<PaymentInstance, 'id'>),
      }));

      onNext(sortInstances(instances));
    },
    error => onError(error),
  );

export const subscribeToSettings = (
  userId: string,
  onNext: (settings: AppSettings) => void,
  onError: SnapshotErrorHandler,
): Unsubscribe =>
  onSnapshot(
    settingsRef(userId),
    snapshot => {
      if (!snapshot.exists()) {
        onNext(DEFAULT_APP_SETTINGS);
        return;
      }

      onNext(normalizeAppSettings(snapshot.data() as Partial<AppSettings>));
    },
    error => onError(error),
  );

export const createCategory = (userId: string, category: Omit<Category, 'id'>): CategoryWriteOperation => {
  const categoryRef = doc(userCollection(userId, 'categories'));
  const commit = setDoc(categoryRef, {
    ...compactObject(category),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    categoryId: categoryRef.id,
    commit,
  };
};

export const removeCategory = async (userId: string, categoryId: string) => {
  await deleteDoc(doc(db, 'users', userId, 'categories', categoryId));
};

export const createPayment = (userId: string, payload: CreatePaymentPayload): PaymentWriteOperation => {
  const batch = writeBatch(db);
  const templateRef = doc(userCollection(userId, 'templates'));
  const instanceRef = doc(userCollection(userId, 'instances'));

  batch.set(templateRef, {
    ...compactObject(payload.template),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(instanceRef, {
    ...compactObject(payload.instance),
    templateId: templateRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const commit = batch.commit();

  return {
    templateId: templateRef.id,
    instanceId: instanceRef.id,
    commit,
  };
};

export const updateTemplate = async (userId: string, templateId: string, data: Partial<PaymentTemplate>) => {
  await updateDoc(doc(db, 'users', userId, 'templates', templateId), {
    ...compactObject(data),
    updatedAt: serverTimestamp(),
  });
};

export const updateInstance = async (userId: string, instanceId: string, data: Partial<PaymentInstance>) => {
  await updateDoc(doc(db, 'users', userId, 'instances', instanceId), {
    ...compactObject(data),
    updatedAt: serverTimestamp(),
  });
};

export const markInstancePaid = async (userId: string, instanceId: string) => {
  await updateDoc(doc(db, 'users', userId, 'instances', instanceId), {
    status: 'paid',
    paidAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
};

export const skipInstance = async (userId: string, instanceId: string) => {
  await updateDoc(doc(db, 'users', userId, 'instances', instanceId), {
    status: 'skipped',
    updatedAt: serverTimestamp(),
  });
};

export const removeTemplateWithInstances = async (userId: string, templateId: string) => {
  const batch = writeBatch(db);
  const relatedInstancesQuery = query(userCollection(userId, 'instances'), where('templateId', '==', templateId));
  const relatedInstances = await getDocs(relatedInstancesQuery);

  batch.delete(doc(db, 'users', userId, 'templates', templateId));
  relatedInstances.forEach(documentSnapshot => batch.delete(documentSnapshot.ref));

  await batch.commit();
};

export const updateSettings = async (userId: string, settings: Partial<AppSettings>) => {
  await setDoc(
    settingsRef(userId),
    {
      ...compactObject(settings),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const createBackupSnapshot = async (userId: string, payload: BackupPayload) => {
  const backupRef = doc(userCollection(userId, 'backups'));
  const createdAt = new Date().toISOString();
  const batch = writeBatch(db);

  batch.set(backupRef, {
    ...removeUndefinedDeep(payload),
    createdAt,
    updatedAt: serverTimestamp(),
    version: 1,
  });

  batch.set(
    settingsRef(userId),
    {
      lastBackupAt: createdAt,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();

  return createdAt;
};
