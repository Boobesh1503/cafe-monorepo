import { z } from 'zod';

const passwordComplexitySchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password cannot exceed 100 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  password: passwordComplexitySchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters').trim(),
  role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN']).optional().default('CUSTOMER'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().length(6, 'MFA code must be exactly 6 digits').regex(/^\d{6}$/, 'MFA code must be numeric').optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(16, 'Invalid or expired password reset token'),
  newPassword: passwordComplexitySchema,
});

export const emailVerificationSchema = z.object({
  token: z.string().min(16, 'Invalid or expired email verification token'),
});

export const mfaVerifySchema = z.object({
  mfaCode: z.string().length(6, 'MFA code must be exactly 6 digits').regex(/^\d{6}$/, 'MFA code must be numeric'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

