import type { CategoryDef } from '@/features/transactions/categories';

export interface RuleCategory extends CategoryDef {
  share: number;      // part du revenu (0..1)
  group: 'needs' | 'wants' | 'savings';
}

/**
 * Règle 50/30/20 adaptée au contexte tunisien.
 *   Besoins : 50%   (logement, courses, transport, factures)
 *   Envies  : 30%   (restaurant, loisirs, santé, autre)
 *   Épargne : 20%   (calculée par différence)
 */
export const RULE_503020: RuleCategory[] = [
  // ─── Besoins (50%) ───
  { id: 'logement',  name: 'Logement',  icon: '🏠', share: 0.285, group: 'needs' },
  { id: 'courses',   name: 'Courses',   icon: '🛒', share: 0.143, group: 'needs' },
  { id: 'transport', name: 'Transport', icon: '🚕', share: 0.043, group: 'needs' },
  { id: 'factures',  name: 'Factures',  icon: '📱', share: 0.029, group: 'needs' },

  // ─── Envies (30%) ───
  { id: 'restaurant', name: 'Restaurant', icon: '🍔', share: 0.114, group: 'wants' },
  { id: 'loisirs',    name: 'Loisirs',    icon: '🎬', share: 0.086, group: 'wants' },
  { id: 'sante',      name: 'Santé',      icon: '💊', share: 0.043, group: 'wants' },
  { id: 'autre',      name: 'Autre',      icon: '📦', share: 0.057, group: 'wants' },
];

export const SAVINGS_SHARE = 0.20;

export interface SuggestedBudget {
  categoryId: string;
  name: string;
  icon: string;
  amount: number;
  group: 'needs' | 'wants';
}

export function computeSuggestions(monthlyIncome: number): SuggestedBudget[] {
  return RULE_503020.map((c) => ({
    categoryId: c.id,
    name: c.name,
    icon: c.icon,
    amount: Math.round(c.share * monthlyIncome),
    group: c.group,
  }));
}

export interface AnalysisResult {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  targetSavings: number;
  targetRate: number;
  suggestions: SuggestedBudget[];
  missingToTarget: number;
  isHealthy: boolean;
}

export function analyze(income: number, expenses: number): AnalysisResult {
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const targetSavings = Math.round(income * SAVINGS_SHARE);
  const targetRate = SAVINGS_SHARE * 100;
  const suggestions = computeSuggestions(income);
  const missingToTarget = Math.max(0, targetSavings - savings);

  return {
    income,
    expenses,
    savings,
    savingsRate,
    targetSavings,
    targetRate,
    suggestions,
    missingToTarget,
    isHealthy: savingsRate >= targetRate,
  };
}
