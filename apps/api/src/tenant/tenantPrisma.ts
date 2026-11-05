import type { PrismaClient } from '@prisma/client';

/**
 * Creates a tenant-isolated repository wrapper.
 * Every operation automatically injects tenantId and validates cross-tenant boundaries.
 */
export class TenantScopedDb {
  constructor(
    private readonly prisma: PrismaClient,
    public readonly tenantId: string,
  ) {}

  /**
   * Sets PostgreSQL session parameter for Row-Level Security (RLS) enforcement.
   */
  async setPostgresTenantContext(): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(
        `SET LOCAL app.current_tenant_id = '${this.tenantId.replace(/'/g, "''")}';`,
      );
    } catch {
      // In-memory or environments without Postgres RLS enabled fallback gracefully
    }
  }

  /**
   * Safe tenant fetch
   */
  async getTenant() {
    return this.prisma.tenant.findUnique({
      where: { id: this.tenantId },
      include: {
        branches: { where: { isActive: true } },
      },
    });
  }

  /**
   * Scoped branch queries
   */
  async findBranches(filter?: { isActive?: boolean }) {
    return this.prisma.branch.findMany({
      where: {
        tenantId: this.tenantId,
        ...(filter?.isActive !== undefined ? { isActive: filter.isActive } : {}),
      },
      include: {
        staffAssignments: {
          include: {
            membership: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findBranchById(branchId: string) {
    return this.prisma.branch.findFirst({
      where: {
        id: branchId,
        tenantId: this.tenantId, // Tenant isolation enforcement
      },
      include: {
        staffAssignments: {
          include: {
            membership: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
    });
  }

  /**
   * Scoped staff memberships
   */
  async findMemberships(filter?: { role?: any; status?: any }) {
    return this.prisma.tenantMembership.findMany({
      where: {
        tenantId: this.tenantId, // Tenant isolation enforcement
        ...(filter?.role ? { role: filter.role } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, isEmailVerified: true },
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

  async findMembershipByUserId(userId: string) {
    return this.prisma.tenantMembership.findFirst({
      where: {
        tenantId: this.tenantId, // Tenant isolation enforcement
        userId,
      },
      include: {
        branchAssignments: {
          include: { branch: true },
        },
      },
    });
  }

  /**
   * Scoped menu items
   */
  async findMenuItems(filter?: { available?: boolean; branchId?: string; category?: any }) {
    return this.prisma.menuItem.findMany({
      where: {
        tenantId: this.tenantId, // Tenant isolation enforcement
        ...(filter?.available !== undefined ? { available: filter.available } : {}),
        ...(filter?.branchId ? { branchId: filter.branchId } : {}),
        ...(filter?.category ? { category: filter.category } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
