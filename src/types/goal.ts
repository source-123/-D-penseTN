export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  color: string;
  createdAt: Date;
}

export type NewSavingsGoal = Omit<SavingsGoal, 'id' | 'createdAt'>;
