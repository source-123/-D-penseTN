import {
  collection, doc, addDoc, getDocs, deleteDoc, updateDoc, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { SavingsGoal, NewSavingsGoal } from '@/types';

const goalsRef = (userId: string) =>
  collection(db, 'users', userId, 'goals');

export async function createGoal(userId: string, input: NewSavingsGoal): Promise<string> {
  const ref = await addDoc(goalsRef(userId), {
    name: input.name,
    icon: input.icon,
    targetAmount: input.targetAmount,
    currentAmount: input.currentAmount,
    deadline: input.deadline ? Timestamp.fromDate(input.deadline) : null,
    color: input.color,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getGoals(userId: string): Promise<SavingsGoal[]> {
  const snap = await getDocs(goalsRef(userId));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      icon: data.icon,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      deadline: data.deadline ? data.deadline.toDate() : undefined,
      color: data.color,
      createdAt: data.createdAt.toDate(),
    } as SavingsGoal;
  });
}

export async function updateGoal(
  userId: string, goalId: string, patch: Partial<NewSavingsGoal>
): Promise<void> {
  const ref = doc(db, 'users', userId, 'goals', goalId);
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.icon !== undefined) payload.icon = patch.icon;
  if (patch.targetAmount !== undefined) payload.targetAmount = patch.targetAmount;
  if (patch.currentAmount !== undefined) payload.currentAmount = patch.currentAmount;
  if (patch.color !== undefined) payload.color = patch.color;
  if (patch.deadline !== undefined) {
    payload.deadline = patch.deadline ? Timestamp.fromDate(patch.deadline) : null;
  }
  await updateDoc(ref, payload);
}

export async function contributeToGoal(
  userId: string, goalId: string, currentAmount: number, addAmount: number
): Promise<void> {
  await updateGoal(userId, goalId, { currentAmount: currentAmount + addAmount });
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
}
