export type TransactionType = 'expense' | 'income';
export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  note?: string;
  date: Date;
  createdAt: Date;
}
export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>;
