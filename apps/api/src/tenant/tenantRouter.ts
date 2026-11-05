import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { validateRequest } from '../security/validation.js';
import { requireAuth } from '../auth/authMiddleware.js';
import { createTenantMiddleware } from './tenantMiddleware.js';
import { TenantService } from './tenantService.js';
import {
  onboardTenantSchema,
  createBranchSchema,
  updateBranchSchema,
  updateTenantProfileSchema,
  inviteStaffSchema,
} from './schemas.js';

export function createTenantRouter(prisma: PrismaClient) {
  const router = Router();
  const service = new TenantService(prisma);
  const { resolveTenant, requireTenantMember } = createTenantMiddleware(prisma);

  // =========================================================================
  // Public Onboarding & Public Storefront Routes
  // =========================================================================

  /**
   * POST /api/v1/tenants/onboard
   * Self-serve cafe owner onboarding workflow.
   */
  router.post(
    '/onboard',
    validateRequest({ body: onboardTenantSchema }),
    async (req, res, next) => {
      try {
        const result = await service.onboardTenant(req.body, {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        res.status(201).json({
          success: true,
          message: `Welcome to Foodie Café Platform! Tenant "${result.tenant.name}" created successfully.`,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * GET /api/v1/tenants/:tenantSlug/public
   * Public storefront info (branding, cafe name, branches, online ordering status).
   */
  router.get('/:tenantSlug/public', async (req, res, next) => {
    try {
      const slug = req.params.tenantSlug.toLowerCase();
      const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          name: true,
          branding: true,
          settings: true,
          status: true,
          branches: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              code: true,
              city: true,
              state: true,
              address: true,
              phone: true,
              openingHours: true,
            },
          },
        },
      });

      if (!tenant || tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
        return res.status(404).json({
          success: false,
          error: { code: 'TENANT_NOT_FOUND', message: 'Cafe not found or unavailable.' },
        });
      }

      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // Authenticated Tenant Protected Routes
  // =========================================================================
  // All routes below require:
  // 1. Valid user authentication (Bearer or Cookie JWT)
  // 2. Tenant Context Resolution (x-tenant-slug / x-tenant-id)
  // 3. Active Tenant Membership & Role Authorization
  // =========================================================================

  const protectedRouter = Router();
  protectedRouter.use(requireAuth);
  protectedRouter.use(resolveTenant);

  /**
   * GET /api/v1/tenants/current
   * Retrieves active tenant profile, branches, and member context.
   */
  protectedRouter.get(
    '/current',
    requireTenantMember(),
    async (req, res, next) => {
      try {
        const tenant = await service.getTenantProfile(req.tenant!.id);
        res.json({
          success: true,
          data: {
            tenant,
            currentMember: req.tenantMember,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * PATCH /api/v1/tenants/current/profile
   * Updates branding, cafe name, and settings (Owner & Manager only).
   */
  protectedRouter.patch(
    '/current/profile',
    requireTenantMember(['OWNER', 'MANAGER']),
    validateRequest({ body: updateTenantProfileSchema }),
    async (req, res, next) => {
      try {
        const updated = await service.updateTenantProfile(
          req.tenant!.id,
          req.user!.userId,
          req.body,
          { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        );

        res.json({
          success: true,
          message: 'Cafe profile and branding updated successfully.',
          data: updated,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * GET /api/v1/tenants/current/branches
   * Lists all branches for current tenant.
   */
  protectedRouter.get(
    '/current/branches',
    requireTenantMember(),
    async (req, res, next) => {
      try {
        const branches = await prisma.branch.findMany({
          where: { tenantId: req.tenant!.id },
          orderBy: { createdAt: 'asc' },
        });

        res.json({
          success: true,
          data: branches,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * POST /api/v1/tenants/current/branches
   * Adds a new branch to the tenant (Owner & Manager only).
   */
  protectedRouter.post(
    '/current/branches',
    requireTenantMember(['OWNER', 'MANAGER']),
    validateRequest({ body: createBranchSchema }),
    async (req, res, next) => {
      try {
        const branch = await service.createBranch(
          req.tenant!.id,
          req.user!.userId,
          req.body,
          { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        );

        res.status(201).json({
          success: true,
          message: `Branch "${branch.name}" created successfully.`,
          data: branch,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * PATCH /api/v1/tenants/current/branches/:branchId
   * Updates branch details (Owner & Manager only).
   */
  protectedRouter.patch(
    '/current/branches/:branchId',
    requireTenantMember(['OWNER', 'MANAGER']),
    validateRequest({ body: updateBranchSchema }),
    async (req, res, next) => {
      try {
        const updated = await service.updateBranch(
          req.tenant!.id,
          req.params.branchId as string,
          req.user!.userId,
          req.body,
          { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        );

        res.json({
          success: true,
          message: 'Branch updated successfully.',
          data: updated,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * GET /api/v1/tenants/current/staff
   * Lists all staff members in the tenant.
   */
  protectedRouter.get(
    '/current/staff',
    requireTenantMember(['OWNER', 'MANAGER']),
    async (req, res, next) => {
      try {
        const staff = await service.listStaff(req.tenant!.id);
        res.json({
          success: true,
          data: staff,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * POST /api/v1/tenants/current/staff
   * Invites and assigns staff to branches (Owner & Manager only).
   */
  protectedRouter.post(
    '/current/staff',
    requireTenantMember(['OWNER', 'MANAGER']),
    validateRequest({ body: inviteStaffSchema }),
    async (req, res, next) => {
      try {
        const member = await service.inviteStaff(
          req.tenant!.id,
          req.user!.userId,
          req.body,
          { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        );

        res.status(201).json({
          success: true,
          message: `Staff member "${member.name}" invited successfully.`,
          data: member,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * GET /api/v1/tenants/current/audit-logs
   * Retrieves security and operational audit logs (Owner only).
   */
  protectedRouter.get(
    '/current/audit-logs',
    requireTenantMember(['OWNER']),
    async (req, res, next) => {
      try {
        const limit = Number(req.query.limit) || 50;
        const offset = Number(req.query.offset) || 0;
        const logs = await service.getAuditLogs(req.tenant!.id, limit, offset);

        res.json({
          success: true,
          data: logs,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  router.use('/', protectedRouter);

  return router;
}

