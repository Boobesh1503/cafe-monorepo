import type { PrismaClient } from '@prisma/client';
import { AppError } from '../security/errorHandler.js';
import { hashPassword } from '../auth/password.js';
import { generateAccessToken, generateSecureRandomToken, hashToken, REFRESH_TOKEN_EXPIRY_DAYS } from '../auth/tokens.js';
import { defaultEmailService, type IEmailService } from '../infrastructure/emailService.js';
import { TenantAuditService } from './auditService.js';
import type {
  OnboardTenantInput,
  CreateBranchInput,
  UpdateBranchInput,
  UpdateTenantProfileInput,
  InviteStaffInput,
} from './schemas.js';
import type { TenantOnboardResult } from './types.js';

export class TenantService {
  private readonly audit: TenantAuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly emailService: IEmailService = defaultEmailService,
  ) {
    this.audit = new TenantAuditService(prisma);
  }

  /**
   * Complete multi-tenant SaaS onboarding workflow:
   * 1. Register/Find Owner User
   * 2. Create Tenant with branding & settings
   * 3. Set Subscription Plan & Trial Expiry (14 days)
   * 4. Create Initial Primary Branch
   * 5. Assign OWNER membership & Branch assignment
   * 6. Generate Session & Auth Tokens
   * 7. Record Audit Log
   */
  async onboardTenant(
    input: OnboardTenantInput,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<TenantOnboardResult> {
    const slug = input.cafeSlug.toLowerCase().trim();

    // 1. Verify slug uniqueness
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new AppError(
        'SLUG_ALREADY_EXISTS',
        `The cafe URL slug "${slug}" is already in use by another business. Please choose a different slug.`,
        409,
      );
    }

    // 2. Create or find Owner user
    let user = await this.prisma.user.findUnique({
      where: { email: input.ownerEmail },
    });

    if (user) {
      // Check if user already owns another active tenant or link membership
      const existingOwnerMembership = await this.prisma.tenantMembership.findFirst({
        where: { userId: user.id, role: 'OWNER' },
      });
      if (existingOwnerMembership) {
        throw new AppError(
          'USER_ALREADY_OWNS_TENANT',
          'An account with this email already owns a registered cafe. Please sign in or use a different email.',
          409,
        );
      }
    } else {
      const passwordHash = await hashPassword(input.ownerPassword);
      user = await this.prisma.user.create({
        data: {
          email: input.ownerEmail,
          passwordHash,
          name: input.ownerName,
          role: 'ADMIN', // Elevated within cafe domain
          isEmailVerified: true, // Auto-verified on owner onboarding
        },
      });
    }

    // 3. 14-Day Free Trial Expiry Date
    const trialDays = 14;
    const subscriptionExpiresAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    const defaultBranding = {
      primaryColor: '#ea580c',
      secondaryColor: '#34251e',
      accentColor: '#f97316',
      tagline: 'Freshly Made • Always Delicious',
      ...(input.branding || {}),
    };

    const defaultSettings = {
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      taxRatePercent: 5,
      orderNumberPrefix: input.cafeSlug.slice(0, 4).toUpperCase(),
      allowOnlineOrders: true,
      tableReservationEnabled: true,
      ...(input.settings || {}),
    };

    // 4. Create Tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        slug,
        name: input.cafeName,
        status: 'TRIAL',
        subscriptionPlan: input.plan || 'FREE_TRIAL',
        subscriptionExpiresAt,
        branding: defaultBranding as any,
        settings: defaultSettings as any,
      },
    });

    // 5. Create Initial Primary Branch
    const branch = await this.prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: input.branchName,
        code: input.branchCode.toUpperCase(),
        address: input.branchAddress,
        city: input.branchCity,
        state: input.branchState,
        postalCode: input.branchPostalCode,
        phone: input.branchPhone ?? null,
        email: input.ownerEmail,
        isActive: true,
      },
    });

    // 6. Create OWNER Membership
    const membership = await this.prisma.tenantMembership.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    // 7. Assign Owner to Primary Branch
    await this.prisma.branchStaffAssignment.create({
      data: {
        membershipId: membership.id,
        branchId: branch.id,
        isPrimary: true,
      },
    });

    // 8. Generate Session & JWT Tokens
    const rawRefreshToken = generateSecureRandomToken(40);
    const tokenHash = hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        deviceInfo: meta.userAgent ?? 'Owner Onboarding Session',
        ipAddress: meta.ipAddress ?? null,
        expiresAt: refreshExpiresAt,
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      mfaEnabled: user.mfaEnabled,
    });

    // 9. Record Tenant Audit Event
    await this.audit.log({
      tenantId: tenant.id,
      userId: user.id,
      action: 'TENANT_ONBOARDED',
      entity: 'Tenant',
      entityId: tenant.id,
      metadata: {
        slug: tenant.slug,
        name: tenant.name,
        plan: tenant.subscriptionPlan,
        primaryBranchId: branch.id,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    // 10. Send Welcome Email
    this.emailService
      .sendEmail({
        to: user.email,
        subject: `Welcome to Foodie Café Platform - ${tenant.name}`,
        text: `Congratulations ${user.name}!\n\nYour cafe "${tenant.name}" has been registered successfully.\nPortal URL: http://localhost:3000/${tenant.slug}\nPrimary Branch: ${branch.name} (${branch.code})\n14-day free trial is now active.\n\nBest,\nFoodie Café Platform`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
            <h2 style="color: #ea580c;">Welcome to Foodie Café SaaS Platform!</h2>
            <p>Congratulations <strong>${user.name}</strong>, your business <strong>${tenant.name}</strong> is now live!</p>
            <p><strong>Your Cafe Slug:</strong> ${tenant.slug}</p>
            <p><strong>Primary Branch:</strong> ${branch.name} (${branch.code})</p>
            <p>Your 14-day PRO trial is active until <strong>${subscriptionExpiresAt.toDateString()}</strong>.</p>
          </div>
        `,
      })
      .catch((err) => console.error('[TenantService] Failed to send onboarding welcome email:', err));

    return {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status,
        subscriptionPlan: tenant.subscriptionPlan,
        branding: tenant.branding as any,
        settings: tenant.settings as any,
      },
      primaryBranch: {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        city: branch.city,
      },
      owner: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: 900,
      },
    };
  }

  /**
   * Retrieves tenant profile and active branch details.
   */
  async getTenantProfile(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branches: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!tenant) {
      throw new AppError('TENANT_NOT_FOUND', 'Tenant not found.', 404);
    }

    return tenant;
  }

  /**
   * Updates cafe profile, branding (colors, logo) and configurations.
   */
  async updateTenantProfile(
    tenantId: string,
    userId: string,
    input: UpdateTenantProfileInput,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ) {
    const existing = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!existing) throw new AppError('TENANT_NOT_FOUND', 'Tenant not found.', 404);

    const updatedBranding = input.branding
      ? { ...((existing.branding as any) || {}), ...input.branding }
      : existing.branding;

    const updatedSettings = input.settings
      ? { ...((existing.settings as any) || {}), ...input.settings }
      : existing.settings;

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        branding: updatedBranding as any,
        settings: updatedSettings as any,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'TENANT_PROFILE_UPDATED',
      entity: 'Tenant',
      entityId: tenantId,
      metadata: { input },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return updated;
  }

  /**
   * Creates a new branch for a tenant.
   */
  async createBranch(
    tenantId: string,
    userId: string,
    input: CreateBranchInput,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ) {
    const code = input.code.toUpperCase().trim();

    // Check code uniqueness within tenant
    const existingBranch = await this.prisma.branch.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code,
        },
      },
    });

    if (existingBranch) {
      throw new AppError(
        'BRANCH_CODE_EXISTS',
        `A branch with code "${code}" already exists in your cafe account.`,
        409,
      );
    }

    const branch = await this.prisma.branch.create({
      data: {
        tenantId,
        name: input.name,
        code,
        address: input.address,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        phone: input.phone ?? null,
        email: input.email ?? null,
        openingHours: (input.openingHours as any) ?? {},
        isActive: true,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'BRANCH_CREATED',
      entity: 'Branch',
      entityId: branch.id,
      metadata: { code: branch.code, name: branch.name, city: branch.city },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return branch;
  }

  /**
   * Updates an existing branch.
   */
  async updateBranch(
    tenantId: string,
    branchId: string,
    userId: string,
    input: UpdateBranchInput,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId }, // Strict tenant scoping
    });

    if (!branch) {
      throw new AppError('BRANCH_NOT_FOUND', 'Branch not found or belongs to another tenant.', 404);
    }

    const updated = await this.prisma.branch.update({
      where: { id: branchId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.address ? { address: input.address } : {}),
        ...(input.city ? { city: input.city } : {}),
        ...(input.state ? { state: input.state } : {}),
        ...(input.postalCode ? { postalCode: input.postalCode } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.openingHours ? { openingHours: input.openingHours as any } : {}),
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'BRANCH_UPDATED',
      entity: 'Branch',
      entityId: branchId,
      metadata: { input },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return updated;
  }

  /**
   * Invites or assigns a staff member to the tenant and specific branches.
   */
  async inviteStaff(
    tenantId: string,
    inviterUserId: string,
    input: InviteStaffInput,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ) {
    // 1. Verify branches belong to this tenant
    const branches = await this.prisma.branch.findMany({
      where: {
        id: { in: input.branchIds },
        tenantId, // Tenant isolation
      },
    });

    if (branches.length !== input.branchIds.length) {
      throw new AppError('INVALID_BRANCH_SELECTION', 'One or more selected branches do not exist in this cafe.', 400);
    }

    // 2. Find or create User
    let user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      const initialPassword = input.initialPassword || generateSecureRandomToken(12);
      const passwordHash = await hashPassword(initialPassword);
      user = await this.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
          role: 'STAFF',
          isEmailVerified: true,
        },
      });
    }

    // 3. Check if already a member of this tenant
    const existingMembership = await this.prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      throw new AppError('STAFF_ALREADY_MEMBER', 'This user is already a member of this cafe.', 409);
    }

    // 4. Create membership
    const membership = await this.prisma.tenantMembership.create({
      data: {
        tenantId,
        userId: user.id,
        role: input.role,
        status: 'ACTIVE',
      },
    });

    // 5. Create branch assignments
    const primaryId = input.primaryBranchId || input.branchIds[0];
    await Promise.all(
      input.branchIds.map((branchId) =>
        this.prisma.branchStaffAssignment.create({
          data: {
            membershipId: membership.id,
            branchId,
            isPrimary: branchId === primaryId,
          },
        }),
      ),
    );

    // 6. Record Audit Event
    await this.audit.log({
      tenantId,
      userId: inviterUserId,
      action: 'STAFF_INVITED',
      entity: 'Staff',
      entityId: user.id,
      metadata: {
        staffEmail: user.email,
        staffRole: input.role,
        branchCount: input.branchIds.length,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      membershipId: membership.id,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: membership.role,
      assignedBranches: branches.map((b: any) => ({ id: b.id, name: b.name, code: b.code })),
    };
  }

  /**
   * Lists all staff members in a tenant.
   */
  async listStaff(tenantId: string) {
    return this.prisma.tenantMembership.findMany({
      where: { tenantId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        branchAssignments: {
          include: {
            branch: {
              select: { id: true, name: true, code: true, city: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Retrieves audit logs for tenant.
   */
  async getAuditLogs(tenantId: string, limit = 50, offset = 0) {
    return this.audit.getTenantLogs(tenantId, limit, offset);
  }
}
