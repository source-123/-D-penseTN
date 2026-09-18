export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string; // "YYYY-MM"
  createdAt: Date;
}

export type NewBudget = Omit<Budget, 'id' | 'createdAt'>;

export interface BudgetWithProgress extends Budget {
  spent: number;
  percent: number;
  remaining: number;
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
}
