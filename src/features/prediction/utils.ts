import type { Transaction, Budget } from '@/types';
import type {
  PredictionResult,
  CategoryProjection,
  Advice,
  HistoryPoint,
  PredictionStatus,
  Confidence,
} from '@/types/prediction';
import { getCategory } from '@/features/transactions/categories';

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#EF4444', courses: '#4ADE80', transport: '#3B82F6',
  logement: '#8B5CF6', sante: '#EC4899', loisirs: '#F59E0B',
  factures: '#06B6D4', autre: '#6B7280',
};

const SAVINGS_TARGET_RATIO = 0.20; // 20%

function colorFor(id: string): string {
  return CATEGORY_COLORS[id] ?? '#6B7280';
}

function monthRange(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
  };
}

/**
 * Coefficient de confiance basé sur le % de mois écoulé.
 *  - < 15% : low (trop tôt)
 *  - 15-40% : medium
 *  - > 40% : high
 */
function computeConfidence(progressPercent: number): Confidence {
  if (progressPercent < 15) return 'low';
  if (progressPercent < 40) return 'medium';
  return 'high';
}

/**
 * Statut global en fonction du solde projeté.
 */
function computeStatus(projectedBalance: number, income: number): PredictionStatus {
  if (income <= 0) return 'warning';
  const ratio = projectedBalance / income;
  if (ratio >= 0.20) return 'great';
  if (ratio >= 0.05) return 'good';
  if (ratio >= 0) return 'warning';
  return 'danger';
}

/**
 * Construit l'historique des N derniers mois (hors mois courant).
 */
function buildHistory(
  transactions: Transaction[],
  now: Date,
  monthsBack: number = 3,
): HistoryPoint[] {
  const points: HistoryPoint[] = [];
  for (let i = monthsBack; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const { start, end } = monthRange(d.getFullYear(), d.getMonth());
    const monthTx = transactions.filter((t) => t.date >= start && t.date < end);

    const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const label = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
      .format(d).replace('.', '');

    points.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      income,
      expenses,
      savings: income - expenses,
    });
  }
  return points;
}

/**
 * Calcule le trend d'une catégorie : compare la moyenne des 3 derniers mois
 * avec la projection actuelle.
 */
function computeTrend(
  categoryId: string,
  projectedThisMonth: number,
  transactions: Transaction[],
  now: Date,
): 'up' | 'down' | 'stable' {
  let totalLast3 = 0;
  for (let i = 3; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const { start, end } = monthRange(d.getFullYear(), d.getMonth());
    const sum = transactions
      .filter((t) => t.type === 'expense' && t.categoryId === categoryId && t.date >= start && t.date < end)
      .reduce((s, t) => s + t.amount, 0);
    totalLast3 += sum;
  }
  const avg = totalLast3 / 3;
  if (avg === 0) return 'stable';
  const diff = (projectedThisMonth - avg) / avg;
  if (diff > 0.15) return 'up';
  if (diff < -0.15) return 'down';
  return 'stable';
}

/**
 * Génère les conseils selon la situation.
 */
function buildAdvices(
  projectedBalance: number,
  income: number,
  targetSavings: number,
  daysRemaining: number,
  categoryProjections: CategoryProjection[],
): Advice[] {
  const advices: Advice[] = [];
  const savingsRate = income > 0 ? (projectedBalance / income) * 100 : 0;

  // 1. Statut global
  if (projectedBalance < 0) {
    advices.push({
      type: 'danger',
      icon: '🚨',
      title: 'Solde négatif prévu',
      description: `À ce rythme, tu finiras le mois à ${Math.abs(projectedBalance).toFixed(0)} DT dans le rouge.`,
    });
  } else if (savingsRate >= 20) {
    advices.push({
      type: 'success',
      icon: '🎉',
      title: 'Excellent rythme',
      description: `Tu es sur la bonne voie pour épargner ${projectedBalance.toFixed(0)} DT ce mois.`,
    });
  } else if (savingsRate >= 5) {
    advices.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Objectif d\'épargne non atteint',
      description: `Il te manque ${(targetSavings - projectedBalance).toFixed(0)} DT pour atteindre 20%.`,
    });
  }

  // 2. Combien réduire par jour
  const missing = Math.max(0, targetSavings - projectedBalance);
  if (missing > 0 && daysRemaining > 0) {
    const daily = missing / daysRemaining;
    advices.push({
      type: 'info',
      icon: '💡',
      title: 'Comment atteindre 20%',
      description: `Réduis tes dépenses de ${daily.toFixed(1)} DT/jour pendant ${daysRemaining} jours.`,
      reductionAmount: daily,
    });
  }

  // 3. Catégories problématiques (budget dépassé ou proche)
  const overBudget = categoryProjections
    .filter((c) => c.budget && c.budgetUsagePercent >= 90)
    .sort((a, b) => b.budgetUsagePercent - a.budgetUsagePercent);

  if (overBudget.length > 0) {
    const worst = overBudget[0];
    advices.push({
      type: worst.budgetUsagePercent >= 100 ? 'danger' : 'warning',
      icon: worst.icon,
      title: `${worst.name} ${worst.budgetUsagePercent >= 100 ? 'dépassé' : 'bientôt dépassé'}`,
      description: `Projection : ${worst.projected.toFixed(0)} DT pour un budget de ${worst.budget!.toFixed(0)} DT (${Math.round(worst.budgetUsagePercent)}%).`,
    });
  }

  // 4. Catégories en hausse anormale
  const risingCats = categoryProjections
    .filter((c) => c.trend === 'up' && c.projected > 50)
    .slice(0, 1);

  if (risingCats.length > 0) {
    const c = risingCats[0];
    advices.push({
      type: 'info',
      icon: '📈',
      title: `${c.name} en hausse`,
      description: `Tes dépenses ${c.name.toLowerCase()} augmentent vs les 3 derniers mois.`,
    });
  }

  return advices.slice(0, 4); // max 4 conseils
}

/**
 * ─── FONCTION PRINCIPALE ───
 * Calcule la prédiction complète pour le mois en cours.
 */
export function computePrediction(
  transactions: Transaction[],
  budgets: Budget[],
  now: Date = new Date(),
): PredictionResult {
  const { start, end } = monthRange(now.getFullYear(), now.getMonth());
  const daysTotal = Math.round((end.getTime() - start.getTime()) / 86400000);
  const daysElapsed = Math.max(1, Math.min(now.getDate(), daysTotal));
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);
  const progressPercent = (daysElapsed / daysTotal) * 100;

  // Transactions du mois courant
  const monthTx = transactions.filter((t) => t.date >= start && t.date < end);

  const currentIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const currentExpenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currentSavings = currentIncome - currentExpenses;

  // ─── Projection linéaire pondérée ───
  // On combine :
  //  - la projection linéaire pure (rythme actuel)
  //  - la projection basée sur l'historique des 3 derniers mois
  // Poids : 65% linéaire si mois bien entamé, sinon 80% historique
  const dailyRate = currentExpenses / daysElapsed;
  const linearProjection = dailyRate * daysTotal;

  // Historique
  const history = buildHistory(transactions, now, 3);
  const historicalAvg = history.length > 0
    ? history.reduce((s, h) => s + h.expenses, 0) / history.length
    : linearProjection;

  const linearWeight = progressPercent >= 40 ? 0.65 : 0.35;
  const historicalWeight = 1 - linearWeight;

  const projectedExpenses = Math.round(
    linearProjection * linearWeight + historicalAvg * historicalWeight,
  );

  const projectedBalance = currentIncome - projectedExpenses;
  const projectedSavingsRate = currentIncome > 0 ? (projectedBalance / currentIncome) * 100 : 0;
  const targetSavings = currentIncome * SAVINGS_TARGET_RATIO;
  const missingToTarget = Math.max(0, targetSavings - projectedBalance);
  const dailyReduction = daysRemaining > 0 ? missingToTarget / daysRemaining : 0;

  // ─── Projections par catégorie ───
  const catMap = new Map<string, number>();
  monthTx
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      catMap.set(t.categoryId, (catMap.get(t.categoryId) ?? 0) + t.amount);
    });

  const categoryProjections: CategoryProjection[] = Array.from(catMap.entries())
    .map(([categoryId, spent]) => {
      const cat = getCategory(categoryId);
      const projectedCat = Math.round((spent / daysElapsed) * daysTotal);
      const budget = budgets.find((b) => b.categoryId === categoryId)?.amount;
      const budgetUsagePercent = budget && budget > 0 ? (projectedCat / budget) * 100 : 0;
      const trend = computeTrend(categoryId, projectedCat, transactions, now);

      return {
        categoryId,
        name: cat.name,
        icon: cat.icon,
        spent,
        projected: projectedCat,
        budget,
        budgetUsagePercent,
        trend,
        color: colorFor(categoryId),
      };
    })
    .sort((a, b) => b.projected - a.projected);

  const status = computeStatus(projectedBalance, currentIncome);
  const confidence = computeConfidence(progressPercent);

  const advices = buildAdvices(
    projectedBalance,
    currentIncome,
    targetSavings,
    daysRemaining,
    categoryProjections,
  );

  const monthLabel = new Intl.DateTimeFormat('fr-FR', {
    month: 'long', year: 'numeric',
  }).format(now);

  return {
    monthLabel,
    daysElapsed,
    daysTotal,
    daysRemaining,
    progressPercent,
    currentIncome,
    currentExpenses,
    currentSavings,
    dailyRate,
    projectedExpenses,
    projectedBalance,
    projectedSavingsRate,
    targetSavings,
    missingToTarget,
    dailyReduction,
    status,
    confidence,
    categories: categoryProjections,
    advices,
    history,
  };
}
