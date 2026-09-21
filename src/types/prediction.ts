export type PredictionStatus = 'great' | 'good' | 'warning' | 'danger';
export type Confidence = 'low' | 'medium' | 'high';

export interface CategoryProjection {
  categoryId: string;
  name: string;
  icon: string;
  spent: number;
  projected: number;
  budget?: number;
  budgetUsagePercent: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export interface Advice {
  type: 'success' | 'warning' | 'danger' | 'info';
  icon: string;
  title: string;
  description: string;
  /** Montant suggéré à réduire, si applicable */
  reductionAmount?: number;
}

export interface HistoryPoint {
  label: string;       // 'Août', 'Juil', ...
  income: number;
  expenses: number;
  savings: number;
}

export interface PredictionResult {
  // ─── Période ───
  monthLabel: string;
  daysElapsed: number;
  daysTotal: number;
  daysRemaining: number;
  progressPercent: number;

  // ─── Données actuelles ───
  currentIncome: number;
  currentExpenses: number;
  currentSavings: number;
  dailyRate: number;

  // ─── Prédiction ───
  projectedExpenses: number;
  projectedBalance: number;
  projectedSavingsRate: number;
  targetSavings: number;          // 20% du revenu
  missingToTarget: number;        // Combien il manque pour atteindre 20%
  dailyReduction: number;         // Combien réduire par jour pour atteindre 20%

  // ─── Qualité ───
  status: PredictionStatus;
  confidence: Confidence;

  // ─── Détails ───
  categories: CategoryProjection[];
  advices: Advice[];
  history: HistoryPoint[];
}
