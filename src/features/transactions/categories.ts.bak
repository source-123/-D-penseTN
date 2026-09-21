import { i18n } from '@/i18n';

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

/** Retourne la catégorie avec son nom traduit */
export function getCategory(id: string): CategoryDef {
  const found = CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
  return {
    ...found,
    name: i18n.t(`categories.${found.id}`),
  };
}

/** Liste complète traduite */
export function getCategories(): CategoryDef[] {
  return CATEGORIES.map((c) => ({ ...c, name: i18n.t(`categories.${c.id}`) }));
}
