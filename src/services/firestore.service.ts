import {
  collection, doc, addDoc, getDocs, deleteDoc, updateDoc,
  query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { NewTransaction, Transaction } from '@/types';

const userTxRef = (userId: string) =>
  collection(db, 'users', userId, 'transactions');

export async function createTransaction(
  userId: string,
  input: NewTransaction
): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(userTxRef(userId), {
    amount: input.amount,
    type: input.type,
    categoryId: input.categoryId,
    note: input.note ?? '',
    date: Timestamp.fromDate(input.date),
    createdAt: now,
  });
  return docRef.id;
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const q = query(userTxRef(userId), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId,
      note: data.note,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
    } as Transaction;
  });
}

export async function getTransaction(
  userId: string,
  transactionId: string
): Promise<Transaction | null> {
  const snap = await getDocs(userTxRef(userId));
  const found = snap.docs.find((d) => d.id === transactionId);
  if (!found) return null;
  const data = found.data();
  return {
    id: found.id,
    amount: data.amount,
    type: data.type,
    categoryId: data.categoryId,
    note: data.note,
    date: data.date.toDate(),
    createdAt: data.createdAt.toDate(),
  } as Transaction;
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: Partial<NewTransaction>
): Promise<void> {
  const ref = doc(db, 'users', userId, 'transactions', transactionId);
  const payload: Record<string, unknown> = {};
  if (input.amount !== undefined) payload.amount = input.amount;
  if (input.type !== undefined) payload.type = input.type;
  if (input.categoryId !== undefined) payload.categoryId = input.categoryId;
  if (input.note !== undefined) payload.note = input.note;
  if (input.date !== undefined) payload.date = Timestamp.fromDate(input.date);
  await updateDoc(ref, payload);
}

export async function deleteTransaction(
  userId: string,
  transactionId: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'transactions', transactionId));
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export async function getMonthlySummary(
  userId: string,
  year: number,
  month: number
): Promise<MonthlySummary> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const q = query(
    userTxRef(userId),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<', Timestamp.fromDate(end))
  );
  const snap = await getDocs(q);
  let totalIncome = 0;
  let totalExpenses = 0;
  snap.forEach((d) => {
    const data = d.data();
    if (data.type === 'income') totalIncome += data.amount;
    else totalExpenses += data.amount;
  });
  return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
}
