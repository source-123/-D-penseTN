import type { TransactionType } from './transaction';

export type Frequency = 'monthly' | 'weekly';

export interface RecurringTemplate {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  note: string;
  frequency: Frequency;
  dayOfMonth?: number; // 1..28 (pour mensuel)
  dayOfWeek?: number;  // 0..6 (0=dimanche, pour hebdo)
  active: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
}

export type NewRecurringTemplate = Omit<
  RecurringTemplate,
  'id' | 'createdAt' | 'lastRun' | 'nextRun'
> & {
  nextRun: Date;
};
