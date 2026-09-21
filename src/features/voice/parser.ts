import { CATEGORIES } from '@/features/transactions/categories';

export interface ParsedTransaction {
  amount: number | null;
  type: 'expense' | 'income';
  categoryId: string;
  note: string;
}

// Mots-clés → catégorie
const KEYWORDS: Record<string, string[]> = {
  restaurant: ['resto', 'restaurant', 'manger', 'dej', 'déj', 'diner', 'dîner', 'cafe', 'café', 'pizza', 'sandwich', 'kebab', 'snack', 'fastfood', 'burger'],
  courses: ['course', 'courses', 'monoprix', 'carrefour', 'marche', 'marché', 'epicerie', 'épicerie', 'alimentation', 'supermarché', 'supermarche', 'geant', 'geant', 'mg', 'achat', 'provisions'],
  transport: ['transport', 'taxi', 'metro', 'métro', 'bus', 'train', 'essence', 'carburant', 'voiture', 'uber', 'bolt', 'louage'],
  logement: ['loyer', 'logement', 'maison', 'appart', 'electricite', 'électricité', 'eau', 'gaz', 'steg', 'sonede'],
  sante: ['pharmacie', 'medecin', 'médecin', 'docteur', 'clinique', 'sante', 'santé', 'hopital', 'hôpital', 'ordonnance', 'analyse'],
  loisirs: ['cinema', 'cinéma', 'film', 'sortie', 'loisir', 'jeu', 'sport', 'salle', 'gym', 'netflix', 'spotify', 'abonnement'],
  factures: ['facture', 'factures', 'telephone', 'téléphone', 'internet', 'orange', 'ooredoo', 'tunisie telecom', 'tt', 'abonnement tel'],
  autre: [],
};

// Revenus → income
const INCOME_KEYWORDS = ['salaire', 'salary', 'paie', 'paye', 'prime', 'bonus', 'virement', 'recu', 'reçu', 'gain', 'revenu', 'remboursement'];

/**
 * "18 dinars restaurant dej" → { amount: 18, categoryId: 'restaurant', note: 'dej', type: 'expense' }
 */
export function parseVoiceText(text: string): ParsedTransaction {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // enlève accents pour matching
    .trim();

  // ─── 1. Montant ───
  // Match : "18", "18.5", "18,5", "18 dinars", "18.500 dt"
  const amountMatch = normalized.match(/(\d+(?:[.,]\d+)?)/);
  let amount: number | null = null;
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(',', '.'));
  }

  // ─── 2. Type (revenu vs dépense) ───
  const isIncome = INCOME_KEYWORDS.some((kw) =>
    normalized.includes(kw)
  );
  const type: 'expense' | 'income' = isIncome ? 'income' : 'expense';

  // ─── 3. Catégorie ───
  let categoryId = 'autre';
  for (const [catId, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      categoryId = catId;
      break;
    }
  }
  // Si c'est un revenu, on met dans "autre"
  if (isIncome) categoryId = 'autre';

  // ─── 4. Note : on enlève le montant et les mots-clés de catégorie ───
  let note = text.trim();
  if (amountMatch) {
    note = note.replace(amountMatch[0], '').trim();
  }
  note = note
    .replace(/\b(dinars?|dt|dinar|d\b)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Retire les mots-clés pour la note finale
  note = note.replace(/^(de|du|de la|des|pour|a|à|au)\s+/i, '');
  if (note.length > 60) note = note.slice(0, 60);
  if (!note) {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    note = cat?.name ?? '';
  }

  return { amount, type, categoryId, note };
}

// Helper pour feedback utilisateur
export function describeParse(parsed: ParsedTransaction): string {
  const cat = CATEGORIES.find((c) => c.id === parsed.categoryId);
  const sign = parsed.type === 'income' ? '+ ' : '- ';
  return `${sign}${parsed.amount ?? '?'} DT · ${cat?.icon ?? ''} ${cat?.name ?? '?'}`;
}
