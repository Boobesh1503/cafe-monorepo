import { z } from 'zod';

export const variantSchema = z.object({
  name: z.string().min(1).max(50),
  priceCents: z.number().int().min(100, 'Price must be at least ₹1.00'),
});

export const addOnSchema = z.object({
  name: z.string().min(1).max(50),
  priceCents: z.number().int().min(0, 'Add-on price cannot be negative'),
});

export const createMenuItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120).trim(),
  description: z.string().max(500).default(''),
  priceCents: z
    .number()
    .int('Price must be an integer (in cents/paise)')
    .min(100, 'Price must be at least 100 (₹1.00)')
    .max(1000000, 'Price cannot exceed ₹10,000'),
  categorySlug: z.string().min(2).max(50).trim().toLowerCase(),
  categoryName: z.string().min(2).max(100).trim(),
  imageUrl: z.string().url().or(z.string().startsWith('/items/')).optional(),
  isVeg: z.boolean().default(true),
  isBestseller: z.boolean().default(false),
  branchId: z.string().optional(), // Branch-specific menu assignment
  variants: z.array(variantSchema).default([]),
  addOns: z.array(addOnSchema).default([]),
  prepTimeMinutes: z.number().int().min(1).max(180).default(15),
  tags: z.array(z.string()).default([]),
  available: z.boolean().default(true),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const updateAvailabilitySchema = z.object({
  available: z.boolean(),
  reason: z.string().max(200).optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
