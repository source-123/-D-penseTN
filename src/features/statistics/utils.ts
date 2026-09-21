import type { Transaction } from '@/types';
import { getCategory } from '@/features/transactions/categories';

export interface CategorySlice {
  categoryId: string;
  name: string;
  icon: string;
  total: number;
  percent: number;
  color: string;
}

export interface MonthPoint {
  label: string;
  income: number;
  expenses: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#EF4444',
  courses: '#4ADE80',
  transport: '#3B82F6',
  logement: '#8B5CF6',
  sante: '#EC4899',
  loisirs: '#F59E0B',
  factures: '#06B6D4',
  autre: '#6B7280',
};

export function colorForCategory(id: string): string {
  return CATEGORY_COLORS[id] ?? '#6B7280';
}

export function buildCategorySlices(
  transactions: Transaction[],
  start: Date,
  end: Date
): CategorySlice[] {
  const map = new Map<string, number>();

  transactions
    .filter((t) => t.type === 'expense' && t.date >= start && t.date < end)
    .forEach((t) => {
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    });

  const total = Array.from(map.values()).reduce((s, v) => s + v, 0);

  return Array.from(map.entries())
    .map(([categoryId, amount]) => {
      const cat = getCategory(categoryId);
      return {
        categoryId,
        name: cat.name,
        icon: cat.icon,
        total: amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
        color: colorForCategory(categoryId),
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function buildMonthlyTrend(
  transactions: Transaction[],
  monthsBack: number = 6
): MonthPoint[] {
  const now = new Date();
  const points: MonthPoint[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const monthTx = transactions.filter((t) => t.date >= start && t.date < end);

    const income = monthTx
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);

    const expenses = monthTx
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    const label = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
      .format(d)
      .replace('.', '');

    points.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      income,
      expenses,
    });
  }

  return points;
}
