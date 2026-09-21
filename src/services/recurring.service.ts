import {
  collection, doc, addDoc, getDocs, deleteDoc, updateDoc, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { createTransaction } from './firestore.service';
import type { RecurringTemplate, NewRecurringTemplate } from '@/types';

const recurringRef = (userId: string) =>
  collection(db, 'users', userId, 'recurring');

export async function createRecurring(
  userId: string, input: NewRecurringTemplate
): Promise<string> {
  const ref = await addDoc(recurringRef(userId), {
    amount: input.amount,
    type: input.type,
    categoryId: input.categoryId,
    note: input.note,
    frequency: input.frequency,
    dayOfMonth: input.dayOfMonth ?? null,
    dayOfWeek: input.dayOfWeek ?? null,
    active: input.active,
    nextRun: Timestamp.fromDate(input.nextRun),
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getRecurring(userId: string): Promise<RecurringTemplate[]> {
  const snap = await getDocs(recurringRef(userId));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId,
      note: data.note,
      frequency: data.frequency,
      dayOfMonth: data.dayOfMonth ?? undefined,
      dayOfWeek: data.dayOfWeek ?? undefined,
      active: data.active,
      lastRun: data.lastRun ? data.lastRun.toDate() : undefined,
      nextRun: data.nextRun.toDate(),
      createdAt: data.createdAt.toDate(),
    } as RecurringTemplate;
  });
}

export async function updateRecurring(
  userId: string, id: string, patch: Partial<RecurringTemplate>
): Promise<void> {
  const ref = doc(db, 'users', userId, 'recurring', id);
  const payload: Record<string, unknown> = {};
  if (patch.amount !== undefined) payload.amount = patch.amount;
  if (patch.type !== undefined) payload.type = patch.type;
  if (patch.categoryId !== undefined) payload.categoryId = patch.categoryId;
  if (patch.note !== undefined) payload.note = patch.note;
  if (patch.frequency !== undefined) payload.frequency = patch.frequency;
  if (patch.dayOfMonth !== undefined) payload.dayOfMonth = patch.dayOfMonth;
  if (patch.dayOfWeek !== undefined) payload.dayOfWeek = patch.dayOfWeek;
  if (patch.active !== undefined) payload.active = patch.active;
  if (patch.nextRun !== undefined) payload.nextRun = Timestamp.fromDate(patch.nextRun);
  if (patch.lastRun !== undefined) payload.lastRun = Timestamp.fromDate(patch.lastRun);
  await updateDoc(ref, payload);
}

export async function deleteRecurring(userId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'recurring', id));
}

/** Calcule la prochaine date d'exécution */
export function computeNextRun(
  from: Date,
  frequency: 'monthly' | 'weekly',
  dayOfMonth?: number,
  dayOfWeek?: number
): Date {
  if (frequency === 'monthly') {
    const target = dayOfMonth ?? 1;
    const next = new Date(from.getFullYear(), from.getMonth(), target);
    if (next <= from) next.setMonth(next.getMonth() + 1);
    return next;
  }
  // weekly
  const target = dayOfWeek ?? 1;
  const next = new Date(from);
  const diff = (target - next.getDay() + 7) % 7 || 7;
  next.setDate(next.getDate() + diff);
  return next;
}

/**
 * Traite les récurrences dont la date est passée :
 * crée les transactions correspondantes et avance nextRun.
 */
export async function processDueRecurrings(userId: string): Promise<number> {
  const templates = await getRecurring(userId);
  const now = new Date();
  let created = 0;

  for (const tpl of templates) {
    if (!tpl.active) continue;
    if (tpl.nextRun > now) continue;

    // Créer la transaction
    try {
      await createTransaction(userId, {
        amount: tpl.amount,
        type: tpl.type,
        categoryId: tpl.categoryId,
        note: tpl.note,
        date: tpl.nextRun,
      });
      created++;
    } catch (e) {
      console.warn('[recurring] create failed', e);
      continue;
    }

    // Calculer la prochaine
    const next = computeNextRun(
      tpl.nextRun, tpl.frequency, tpl.dayOfMonth, tpl.dayOfWeek
    );
    await updateRecurring(userId, tpl.id, {
      lastRun: tpl.nextRun,
      nextRun: next,
    });
  }

  return created;
}
