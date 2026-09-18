import type { Budget, BudgetWithProgress, Transaction } from '@/types';

function getMonthRange(monthKey: string): { start: Date; end: Date } {
  const [y, m] = monthKey.split('-').map(Number);
  return {
    start: new Date(y, m - 1, 1),
    end: new Date(y, m, 1),
  };
}

export function computeBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[]
): BudgetWithProgress[] {
  return budgets.map((b) => {
    const { start, end } = getMonthRange(b.month);
    const spent = transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.categoryId === b.categoryId &&
          t.date >= start &&
          t.date < end
      )
      .reduce((s, t) => s + t.amount, 0);

    const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const remaining = b.amount - spent;

    let status: BudgetWithProgress['status'] = 'safe';
    if (percent >= 100) status = 'exceeded';
    else if (percent >= 80) status = 'danger';
    else if (percent >= 60) status = 'warning';

    return { ...b, spent, percent, remaining, status };
  });
}

export function statusColor(status: BudgetWithProgress['status']): string {
  switch (status) {
    case 'safe': return '#4ADE80';
    case 'warning': return '#F59E0B';
    case 'danger': return '#F97316';
    case 'exceeded': return '#EF4444';
  }
}
