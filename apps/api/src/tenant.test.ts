import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { createApp } from './app.js';
import { generateAccessToken } from './auth/tokens.js';
import { TenantService } from './tenant/tenantService.js';
import type { ApiDependencies } from './infrastructure/dependencies.js';

// =========================================================================
// In-Memory Mock Prisma Implementation for Tenant SaaS Tests
// =========================================================================
function createMockPrisma() {
  const users: any[] = [];
  const sessions: any[] = [];
  const verificationTokens: any[] = [];
  const tenants: any[] = [];
  const branches: any[] = [];
  const memberships: any[] = [];
  const branchAssignments: any[] = [];
  const auditLogs: any[] = [];
  const menuItems: any[] = [];

  const mock = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.email) return users.find((u) => u.email === where.email) || null;
        if (where.id) return users.find((u) => u.id === where.id) || null;
        return null;
      },
      create: async ({ data }: any) => {
        const user = {
          id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          failedLoginAttempts: 0,
          lockedUntil: null,
          mfaEnabled: false,
          mfaSecret: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        users.push(user);
        return user;
      },
    },
    session: {
      create: async ({ data }: any) => {
        const session = { id: `sess_${Date.now()}`, ...data };
        sessions.push(session);
        return session;
      },
    },
    tenant: {
      findUnique: async ({ where, select, include }: any) => {
        const t = tenants.find((item) => (where.slug ? item.slug === where.slug : item.id === where.id));
        if (!t) return null;
        if (select?.branches || include?.branches) {
          const tenantBranches = branches.filter(
            (b) => b.tenantId === t.id && (select?.branches?.where?.isActive ? b.isActive : true),
          );
          return { ...t, branches: tenantBranches };
        }
        return t;
      },
      findFirst: async ({ where }: any) => {
        return tenants.find((t) => {
          if (where.id && t.id !== where.id) return false;
          if (where.slug && t.slug !== where.slug) return false;
          return true;
        }) || null;
      },
      create: async ({ data }: any) => {
        const tenant = {
          id: `tenant_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        tenants.push(tenant);
        return tenant;
      },
      update: async ({ where, data }: any) => {
        const tenant = tenants.find((t) => t.id === where.id);
        if (!tenant) throw new Error('Tenant not found');
        Object.assign(tenant, data, { updatedAt: new Date() });
        return tenant;
      },
    },
    branch: {
      findUnique: async ({ where }: any) => {
        if (where.tenantId_code) {
          return (
            branches.find(
              (b) => b.tenantId === where.tenantId_code.tenantId && b.code === where.tenantId_code.code,
            ) || null
          );
        }
        if (where.id) return branches.find((b) => b.id === where.id) || null;
        return null;
      },
      findFirst: async ({ where }: any) => {
        return branches.find((b) => {
          if (where.id && b.id !== where.id) return false;
          if (where.tenantId && b.tenantId !== where.tenantId) return false;
          return true;
        }) || null;
      },
      findMany: async ({ where }: any) => {
        return branches.filter((b) => {
          if (where.tenantId && b.tenantId !== where.tenantId) return false;
          if (where.id?.in && !where.id.in.includes(b.id)) return false;
          return true;
        });
      },
      create: async ({ data }: any) => {
        const branch = {
          id: `br_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        branches.push(branch);
        return branch;
      },
      update: async ({ where, data }: any) => {
        const branch = branches.find((b) => b.id === where.id);
        if (!branch) throw new Error('Branch not found');
        Object.assign(branch, data, { updatedAt: new Date() });
        return branch;
      },
    },
    tenantMembership: {
      findUnique: async ({ where }: any) => {
        if (where.tenantId_userId) {
          return (
            memberships.find(
              (m) =>
                m.tenantId === where.tenantId_userId.tenantId &&
                m.userId === where.tenantId_userId.userId,
            ) || null
          );
        }
        return null;
      },
      findFirst: async ({ where, include }: any) => {
        const mem = memberships.find((m) => {
          if (where.tenantId && m.tenantId !== where.tenantId) return false;
          if (where.userId && m.userId !== where.userId) return false;
          if (where.role && m.role !== where.role) return false;
          if (where.status && m.status !== where.status) return false;
          return true;
        });
        if (!mem) return null;
        if (include?.branchAssignments) {
          const assigns = branchAssignments.filter((a) => a.membershipId === mem.id);
          return { ...mem, branchAssignments: assigns };
        }
        return mem;
      },
      findMany: async ({ where }: any) => {
        return memberships
          .filter((m) => m.tenantId === where.tenantId)
          .map((m) => {
            const user = users.find((u) => u.id === m.userId);
            const assigns = branchAssignments
              .filter((a) => a.membershipId === m.id)
              .map((a) => {
                const branch = branches.find((b) => b.id === a.branchId);
                return { ...a, branch };
              });
            return { ...m, user, branchAssignments: assigns };
          });
      },
      create: async ({ data }: any) => {
        const membership = {
          id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        memberships.push(membership);
        return membership;
      },
    },
    branchStaffAssignment: {
      create: async ({ data }: any) => {
        const assign = { id: `bsa_${Date.now()}`, ...data };
        branchAssignments.push(assign);
        return assign;
      },
    },
    auditLog: {
      create: async ({ data }: any) => {
        const log = { id: `aud_${Date.now()}`, createdAt: new Date(), ...data };
        auditLogs.push(log);
        return log;
      },
      findMany: async ({ where }: any) => {
        return auditLogs
          .filter((l) => l.tenantId === where.tenantId)
          .map((l) => {
            const user = users.find((u) => u.id === l.userId);
            return { ...l, user };
          });
      },
    },
    menuItem: {
      findMany: async () => menuItems,
    },
    _db: { users, tenants, branches, memberships, auditLogs },
  };

  return mock as unknown as PrismaClient & { _db: any };
}

function createTestDependencies(mockPrisma: PrismaClient): ApiDependencies {
  return {
    checkDatabase: async () => {},
    checkCache: async () => {},
    getAvailableMenu: async () => [],
    getCachedMenu: async () => null,
    cacheMenu: async () => {},
    prismaClient: mockPrisma,
  };
}

// =========================================================================
// Tests: Phase 5 Multi-Tenant SaaS Architecture
// =========================================================================

test('Phase 5 SaaS: Self-serve Cafe Owner Onboarding Flow', async () => {
  const mockPrisma = createMockPrisma();
  const service = new TenantService(mockPrisma);

  const result = await service.onboardTenant({
    ownerName: 'Chef Sanjay',
    ownerEmail: 'sanjay@spicevalleycafe.com',
    ownerPassword: 'StrongPassword123!',
    cafeName: 'Spice Valley Café',
    cafeSlug: 'spice-valley-cafe',
    branchName: 'Main Bistro',
    branchCode: 'SV-MAIN',
    branchAddress: '42 MG Road',
    branchCity: 'Bengaluru',
    branchState: 'Karnataka',
    branchPostalCode: '560001',
    plan: 'PRO',
  });

  assert.ok(result.tenant.id, 'Tenant must have an ID');
  assert.equal(result.tenant.slug, 'spice-valley-cafe');
  assert.equal(result.tenant.name, 'Spice Valley Café');
  assert.equal(result.tenant.status, 'TRIAL');
  assert.equal(result.tenant.subscriptionPlan, 'PRO');
  assert.equal(result.primaryBranch.code, 'SV-MAIN');
  assert.equal(result.owner.email, 'sanjay@spicevalleycafe.com');
  assert.ok(result.tokens.accessToken, 'Must generate access token');
  assert.ok(result.tokens.refreshToken, 'Must generate refresh token');

  // Verify Audit Log was recorded
  const logs = await service.getAuditLogs(result.tenant.id);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].action, 'TENANT_ONBOARDED');
  assert.equal(logs[0].entity, 'Tenant');
});

test('Phase 5 SaaS: Reject Duplicate Tenant Slug (409 Conflict)', async () => {
  const mockPrisma = createMockPrisma();
  const service = new TenantService(mockPrisma);

  await service.onboardTenant({
    ownerName: 'Owner 1',
    ownerEmail: 'owner1@cafe.com',
    ownerPassword: 'StrongPassword123!',
    cafeName: 'First Cafe',
    cafeSlug: 'my-unique-cafe',
    branchName: 'Branch 1',
    branchCode: 'B1',
    branchAddress: 'Address 1',
    branchCity: 'Chennai',
    branchState: 'TN',
    branchPostalCode: '600001',
    plan: 'FREE_TRIAL',
  });

  await assert.rejects(
    async () => {
      await service.onboardTenant({
        ownerName: 'Owner 2',
        ownerEmail: 'owner2@cafe.com',
        ownerPassword: 'StrongPassword123!',
        cafeName: 'Second Cafe',
        cafeSlug: 'my-unique-cafe', // Duplicate slug
        branchName: 'Branch 2',
        branchCode: 'B2',
        branchAddress: 'Address 2',
        branchCity: 'Chennai',
        branchState: 'TN',
        branchPostalCode: '600001',
        plan: 'FREE_TRIAL',
      });
    },
    (err: any) => err.code === 'SLUG_ALREADY_EXISTS' && err.statusCode === 409,
  );
});

test('Phase 5 SaaS: Multi-Branch Creation & Code Uniqueness within Tenant', async () => {
  const mockPrisma = createMockPrisma();
  const service = new TenantService(mockPrisma);

  const onboard = await service.onboardTenant({
    ownerName: 'Foodie Owner',
    ownerEmail: 'foodie@test.com',
    ownerPassword: 'StrongPassword123!',
    cafeName: 'Foodie Cafe Central',
    cafeSlug: 'foodie-central',
    branchName: 'Central HQ',
    branchCode: 'CENTRAL-01',
    branchAddress: 'Anna Salai',
    branchCity: 'Chennai',
    branchState: 'TN',
    branchPostalCode: '600002',
    plan: 'PRO',
  });

  // Create second branch
  const secondBranch = await service.createBranch(onboard.tenant.id, onboard.owner.id, {
    name: 'OMR Tech Park Branch',
    code: 'OMR-02',
    address: 'OMR IT Expressway',
    city: 'Chennai',
    state: 'TN',
    postalCode: '600096',
  });

  assert.equal(secondBranch.code, 'OMR-02');
  assert.equal(secondBranch.name, 'OMR Tech Park Branch');

  // Attempt duplicate branch code in same tenant -> Expect 409
  await assert.rejects(
    async () => {
      await service.createBranch(onboard.tenant.id, onboard.owner.id, {
        name: 'Another OMR Branch',
        code: 'OMR-02', // Duplicate code in same tenant
        address: 'Another address',
        city: 'Chennai',
        state: 'TN',
        postalCode: '600096',
      });
    },
    (err: any) => err.code === 'BRANCH_CODE_EXISTS' && err.statusCode === 409,
  );
});

test('Phase 5 SaaS: Staff Invitation and Branch Assignment', async () => {
  const mockPrisma = createMockPrisma();
  const service = new TenantService(mockPrisma);

  const onboard = await service.onboardTenant({
    ownerName: 'Cafe Boss',
    ownerEmail: 'boss@cafebistro.com',
    ownerPassword: 'StrongPassword123!',
    cafeName: 'Bistro Royale',
    cafeSlug: 'bistro-royale',
    branchName: 'Main Hall',
    branchCode: 'MAIN',
    branchAddress: 'Palace Road',
    branchCity: 'Mysuru',
    branchState: 'Karnataka',
    branchPostalCode: '570001',
    plan: 'PRO',
  });

  // Invite Kitchen Staff
  const staff = await service.inviteStaff(onboard.tenant.id, onboard.owner.id, {
    email: 'chef.ram@cafebistro.com',
    name: 'Chef Ram',
    role: 'KITCHEN_STAFF',
    branchIds: [onboard.primaryBranch.id],
  });

  assert.equal(staff.email, 'chef.ram@cafebistro.com');
  assert.equal(staff.role, 'KITCHEN_STAFF');
  assert.equal(staff.assignedBranches.length, 1);

  // Verify staff list
  const staffList = await service.listStaff(onboard.tenant.id);
  assert.equal(staffList.length, 2); // Owner + Chef Ram
});

test('Phase 5 SaaS: Cross-Tenant Access Prevention & Security Isolation (HTTP API)', async () => {
  const mockPrisma = createMockPrisma();
  const service = new TenantService(mockPrisma);
  const app = createApp(createTestDependencies(mockPrisma));

  // 1. Create Tenant A (Cafe Alpha)
  const tenantA = await service.onboardTenant({
    ownerName: 'Owner Alpha',
    ownerEmail: 'alpha@cafe.com',
    ownerPassword: 'StrongPassword123!',
    cafeName: 'Cafe Alpha',
    cafeSlug: 'cafe-alpha',
    branchName: 'Alpha HQ',
    branchCode: 'ALP-01',
    branchAddress: 'Alpha Street',
    branchCity: 'Coimbatore',
    branchState: 'TN',
    branchPostalCode: '641001',
    plan: 'STARTER',
  });

  // 2. Create Tenant B (Cafe Beta)
  const tenantB = await service.onboardTenant({
    ownerName: 'Owner Beta',
    ownerEmail: 'beta@cafe.com',
    ownerPassword: 'StrongPassword123!',
    cafeName: 'Cafe Beta',
    cafeSlug: 'cafe-beta',
    branchName: 'Beta HQ',
    branchCode: 'BET-01',
    branchAddress: 'Beta Street',
    branchCity: 'Madurai',
    branchState: 'TN',
    branchPostalCode: '625001',
    plan: 'STARTER',
  });

  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Owner Alpha attempts to access Tenant B's private branches
    // using Owner Alpha's valid JWT + Tenant B's slug header
    const crossTenantRes = await fetch(`${baseUrl}/api/v1/tenants/current/branches`, {
      headers: {
        Authorization: `Bearer ${tenantA.tokens.accessToken}`, // Owner Alpha's token
        'x-tenant-slug': 'cafe-beta', // But requesting Tenant Beta!
      },
    });

    assert.equal(
      crossTenantRes.status,
      403,
      'Cross-tenant access attempt must be rejected with 403 Forbidden',
    );

    const body = (await crossTenantRes.json()) as any;
    assert.equal(
      body.error.code,
      'CROSS_TENANT_ACCESS_DENIED',
      'Should return CROSS_TENANT_ACCESS_DENIED error code',
    );

    // Legitimate access to own tenant succeeds
    const legitRes = await fetch(`${baseUrl}/api/v1/tenants/current/branches`, {
      headers: {
        Authorization: `Bearer ${tenantA.tokens.accessToken}`,
        'x-tenant-slug': 'cafe-alpha',
      },
    });

    assert.equal(legitRes.status, 200, 'Legitimate tenant access should succeed with 200 OK');
    const legitBody = (await legitRes.json()) as any;
    assert.equal(legitBody.success, true);
    assert.equal(legitBody.data.length, 1);
    assert.equal(legitBody.data[0].code, 'ALP-01');

    // Public storefront endpoint allows customer view without auth
    const publicRes = await fetch(`${baseUrl}/api/v1/tenants/cafe-alpha/public`);
    assert.equal(publicRes.status, 200);
    const publicBody = (await publicRes.json()) as any;
    assert.equal(publicBody.data.name, 'Cafe Alpha');
    assert.equal(publicBody.data.branches[0].name, 'Alpha HQ');
  } finally {
    server.close();
  }
});
