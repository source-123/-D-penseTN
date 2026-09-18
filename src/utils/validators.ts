import { z } from 'zod';

export const emailSchema = z.string().email('Email invalide');
export const passwordSchema = z.string().min(6, 'Au moins 6 caractères');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// ⚠️ amount est une string dans le formulaire (RHF)
// zod la transforme en number au submit
export const transactionSchema = z.object({
  amount: z
    .string()
    .min(1, 'Montant requis')
    .transform((v) => parseFloat(v.replace(',', '.')))
    .refine((n) => !isNaN(n) && n > 0, 'Montant invalide'),
  categoryId: z.string().min(1, 'Catégorie requise'),
  note: z.string().optional(),
  type: z.enum(['expense', 'income']).default('expense'),
});

// Type INPUT = ce que RHF stocke (avant transform)
export type TransactionFormInput = z.input<typeof transactionSchema>;

// Type OUTPUT = ce que zod retourne après transform
export type TransactionInput = z.output<typeof transactionSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
