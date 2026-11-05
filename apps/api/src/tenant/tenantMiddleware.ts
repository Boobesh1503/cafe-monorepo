import type { Request, Response, NextFunction } from 'express';
import type { PrismaClient } from '@prisma/client';
import { AppError } from '../security/errorHandler.js';
import type { TenantContext, AuthenticatedTenantRequestMember, TenantMemberRole } from './types.js';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      tenantMember?: AuthenticatedTenantRequestMember;
    }
  }
}

export function createTenantMiddleware(prisma: PrismaClient) {
  /**
   * Resolves tenant from request headers, subdomains, or parameters,
   * validates status and subscription, and attaches req.tenant.
   */
  async function resolveTenant(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      const headerSlug = req.headers['x-tenant-slug'] as string | undefined;
      const headerId = req.headers['x-tenant-id'] as string | undefined;
      const paramSlug = (req.params.tenantSlug || req.query.tenantSlug) as string | undefined;
      const paramId = (req.params.tenantId || req.query.tenantId) as string | undefined;

      // Also check Host subdomain (e.g., "star-cafe.domain.com")
      let subdomainSlug: string | undefined;
      const host = req.hostname || req.headers.host || '';
      const parts = host.split('.');
      if (parts.length > 2 && parts[0] !== 'api' && parts[0] !== 'admin' && parts[0] !== 'www') {
        subdomainSlug = parts[0].toLowerCase();
      }

      const tenantIdentifier = (headerSlug || paramSlug || subdomainSlug || '').trim().toLowerCase();
      const tenantId = (headerId || paramId || '').trim();

      if (!tenantIdentifier && !tenantId) {
        throw new AppError(
          'TENANT_NOT_SPECIFIED',
          'A valid tenant identifier (x-tenant-slug or x-tenant-id header) is required.',
          400,
        );
      }

      const tenant = await prisma.tenant.findFirst({
        where: tenantId
          ? { id: tenantId }
          : { slug: tenantIdentifier },
      });

      if (!tenant) {
        throw new AppError('TENANT_NOT_FOUND', 'The requested cafe tenant was not found.', 404);
      }

      // Check tenant operational status
      if (tenant.status === 'SUSPENDED') {
        throw new AppError('TENANT_SUSPENDED', 'This cafe account is temporarily suspended. Please contact support.', 403);
      }

      if (tenant.status === 'CANCELLED') {
        throw new AppError('TENANT_CANCELLED', 'This cafe subscription has been cancelled.', 403);
      }

      // Check subscription expiry
      if (tenant.subscriptionExpiresAt && tenant.subscriptionExpiresAt < new Date()) {
        throw new AppError('SUBSCRIPTION_EXPIRED', 'The subscription plan for this cafe has expired. Please renew.', 402);
      }

      req.tenant = {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status,
        subscriptionPlan: tenant.subscriptionPlan,
        subscriptionExpiresAt: tenant.subscriptionExpiresAt,
        branding: (tenant.branding as any) ?? {},
        settings: (tenant.settings as any) ?? {
          currency: 'INR',
          currencySymbol: '₹',
          timezone: 'Asia/Kolkata',
          taxRatePercent: 5,
          orderNumberPrefix: 'CAFE',
          allowOnlineOrders: true,
          tableReservationEnabled: true,
        },
      };

      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Requires that the authenticated user is an active member of req.tenant with specific role(s).
   * Prevents cross-tenant data access.
   */
  function requireTenantMember(allowedRoles?: TenantMemberRole[]) {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new AppError('UNAUTHORIZED', 'Authentication required.', 401);
        }

        if (!req.tenant) {
          throw new AppError('TENANT_CONTEXT_MISSING', 'Tenant context must be resolved prior to authorization.', 500);
        }

        // Platform Super Admin bypass for operational governance
        if (req.user.role === 'SUPER_ADMIN') {
          req.tenantMember = {
            membershipId: 'platform_super_admin',
            role: 'OWNER',
            status: 'ACTIVE',
            assignedBranchIds: [],
          };
          return next();
        }

        // Query membership in the active tenant
        const membership = await prisma.tenantMembership.findFirst({
          where: {
            tenantId: req.tenant.id,
            userId: req.user.userId,
            status: 'ACTIVE',
          },
          include: {
            branchAssignments: {
              select: { branchId: true },
            },
          },
        });

        // Cross-Tenant Access Prevention Check
        if (!membership) {
          console.warn(
            `[Security Warning] User ${req.user.userId} attempted cross-tenant access to Tenant ${req.tenant.id} (${req.tenant.slug}) from IP ${req.ip}`,
          );
          throw new AppError(
            'CROSS_TENANT_ACCESS_DENIED',
            'You do not have permission to access resources belonging to this cafe.',
            403,
          );
        }

        // Role authorization check
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
          throw new AppError(
            'FORBIDDEN',
            `Access restricted to roles: ${allowedRoles.join(', ')}. Your role is ${membership.role}.`,
            403,
          );
        }

        req.tenantMember = {
          membershipId: membership.id,
          role: membership.role,
          status: membership.status,
          assignedBranchIds: (membership.branchAssignments as any[]).map((a: any) => a.branchId),
        };

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  return {
    resolveTenant,
    requireTenantMember,
  };
}
