import { z } from 'zod';

export const menuCategorySchema = z.enum(['coffee', 'tea', 'bakery', 'seasonal']);
export type MenuCategory = z.infer<typeof menuCategorySchema>;

export const menuItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  priceCents: z.number().int().nonnegative(),
  category: menuCategorySchema,
  tags: z.array(z.string()).default([]),
  available: z.boolean().default(true),
});
export type MenuItem = z.infer<typeof menuItemSchema>;

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(2000),
});
export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export function createCafeApiClient(baseUrl: string) {
  const base = baseUrl.replace(/\/+$/, '');

  return {
    async getMenu(signal?: AbortSignal): Promise<MenuItem[]> {
      const response = await fetch(`${base}/api/menu`, { signal });
      if (!response.ok) throw new Error(`Menu request failed (${response.status})`);
      return menuItemSchema.array().parse(await response.json());
    },
    async submitContact(
      payload: ContactSubmission,
      signal?: AbortSignal,
    ): Promise<{ accepted: boolean }> {
      const body = contactSubmissionSchema.parse(payload);
      const response = await fetch(`${base}/api/contact`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
      if (!response.ok) throw new Error(`Contact request failed (${response.status})`);
      return response.json() as Promise<{ accepted: boolean }>;
    },
  };
}
