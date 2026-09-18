import {
  collection, doc, addDoc, getDocs, deleteDoc, updateDoc,
  query, where, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Budget, NewBudget } from '@/types';

const userBudgetsRef = (userId: string) =>
  collection(db, 'users', userId, 'budgets');

function currentMonthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function createBudget(
  userId: string,
  input: NewBudget
): Promise<string> {
  const ref = await addDoc(userBudgetsRef(userId), {
    categoryId: input.categoryId,
    amount: input.amount,
    month: input.month,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getBudgetsForMonth(
  userId: string,
  month: string = currentMonthKey()
): Promise<Budget[]> {
  const q = query(userBudgetsRef(userId), where('month', '==', month));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      categoryId: data.categoryId,
      amount: data.amount,
      month: data.month,
      createdAt: data.createdAt.toDate(),
    } as Budget;
  });
}

export async function updateBudget(
  userId: string,
  budgetId: string,
  amount: number
): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'budgets', budgetId), { amount });
}

export async function deleteBudget(
  userId: string,
  budgetId: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'budgets', budgetId));
}

export { currentMonthKey };
