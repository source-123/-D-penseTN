export interface CategoryDef {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'restaurant', name: 'Restaurant', icon: '🍔' },
  { id: 'courses', name: 'Courses', icon: '🛒' },
  { id: 'transport', name: 'Transport', icon: '🚕' },
  { id: 'logement', name: 'Logement', icon: '🏠' },
  { id: 'sante', name: 'Santé', icon: '💊' },
  { id: 'loisirs', name: 'Loisirs', icon: '🎬' },
  { id: 'factures', name: 'Factures', icon: '📱' },
  { id: 'autre', name: 'Autre', icon: '📦' },
];

export function getCategory(id: string): CategoryDef {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
