import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const tenantBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color').optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color').optional(),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color').optional(),
  tagline: z.string().max(160).optional(),
  fontFamily: z.string().max(60).optional(),
});

export const tenantSettingsSchema = z.object({
  currency: z.string().min(3).max(5).default('INR'),
  currencySymbol: z.string().min(1).max(5).default('₹'),
  timezone: z.string().min(2).max(50).default('Asia/Kolkata'),
  taxRatePercent: z.number().min(0).max(100).default(5),
  orderNumberPrefix: z.string().min(1).max(10).default('CAFE'),
  allowOnlineOrders: z.boolean().default(true),
  tableReservationEnabled: z.boolean().default(true),
});

export const onboardTenantSchema = z.object({
  // Owner information
  ownerName: z.string().min(2, 'Name must have at least 2 characters').max(100),
  ownerEmail: z.string().email('Valid email is required').toLowerCase().trim(),
  ownerPassword: z
    .string()
    .min(10, 'Password must be at least 10 characters long')
    .max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  
  // Cafe Business Info
  cafeName: z.string().min(2, 'Cafe name must be at least 2 characters').max(120).trim(),
  cafeSlug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(63, 'Slug cannot exceed 63 characters')
    .regex(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  
  // Initial Primary Branch
  branchName: z.string().min(2).max(120).default('Main Branch'),
  branchCode: z.string().min(2).max(30).default('MAIN-01'),
  branchAddress: z.string().min(5).max(255).default('123 High Street'),
  branchCity: z.string().min(2).max(100).default('Chennai'),
  branchState: z.string().min(2).max(100).default('Tamil Nadu'),
  branchPostalCode: z.string().min(4).max(20).default('600001'),
  branchPhone: z.string().min(7).max(30).optional(),

  // Optional Plan (defaults to 14-day PRO trial)
  plan: z.enum(['FREE_TRIAL', 'STARTER', 'PRO', 'ENTERPRISE']).default('FREE_TRIAL'),
  branding: tenantBrandingSchema.optional(),
  settings: tenantSettingsSchema.partial().optional(),
});

export const createBranchSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  code: z.string().min(2).max(30).trim().toUpperCase(),
  phone: z.string().min(7).max(30).optional(),
  email: z.string().email().optional(),
  address: z.string().min(5).max(255).trim(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(100).trim(),
  postalCode: z.string().min(4).max(20).trim(),
  openingHours: z.record(z.string()).optional(),
});

export const updateBranchSchema = createBranchSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const updateTenantProfileSchema = z.object({
  name: z.string().min(2).max(120).trim().optional(),
  branding: tenantBrandingSchema.partial().optional(),
  settings: tenantSettingsSchema.partial().optional(),
});

export const inviteStaffSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  name: z.string().min(2).max(100).trim(),
  role: z.enum(['MANAGER', 'KITCHEN_STAFF', 'CASHIER', 'WAITER']),
  branchIds: z.array(z.string()).min(1, 'At least one branch must be assigned'),
  primaryBranchId: z.string().optional(),
  initialPassword: z.string().min(8).max(128).optional(),
});

export type OnboardTenantInput = z.infer<typeof onboardTenantSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type UpdateTenantProfileInput = z.infer<typeof updateTenantProfileSchema>;
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

