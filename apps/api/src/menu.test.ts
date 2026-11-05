import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { createApp } from './app.js';
import { TenantService } from './tenant/tenantService.js';
import { MenuService } from './menu/menuService.js';
import type { ApiDependencies } from './infrastructure/dependencies.js';

function createMockPrisma() {
  const users: any[] = [];
  const sessions: any[] = [];
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
      findUnique: async ({ where }: any) => {
        if (where.slug) return tenants.find((t) => t.slug === where.slug) || null;
        if (where.id) return tenants.find((t) => t.id === where.id) || null;
        return null;
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
    },
    branch: {
      findUnique: async ({ where }: any) => {
        if (where.tenantId_code) {
          return branches.find(
            (b) => b.tenantId === where.tenantId_code.tenantId && b.code === where.tenantId_code.code,
          ) || null;
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
    },
    tenantMembership: {
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
      create: async ({ data }: any) => {
        const mem = { id: `mem_${Date.now()}`, ...data };
        memberships.push(mem);
        return mem;
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
    },
    menuItem: {
      findFirst: async ({ where }: any) => {
        return menuItems.find((i) => {
          if (where.id && i.id !== where.id) return false;
          if (where.tenantId && i.tenantId !== where.tenantId) return false;
          return true;
        }) || null;
      },
      findMany: async ({ where }: any) => {
        return menuItems.filter((i) => {
          if (where.tenantId && i.tenantId !== where.tenantId) return false;
          if (where.categorySlug && i.categorySlug !== where.categorySlug) return false;
          if (where.isVeg !== undefined && i.isVeg !== where.isVeg) return false;
          if (where.available !== undefined && i.available !== where.available) return false;
          return true;
        });
      },
      create: async ({ data }: any) => {
        const item = {
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        menuItems.push(item);
        return item;
      },
      update: async ({ where, data }: any) => {
        const item = menuItems.find((i) => i.id === where.id);
        if (!item) throw new Error('Item not found');
        Object.assign(item, data, { updatedAt: new Date() });
        return item;
      },
      delete: async ({ where }: any) => {
        const idx = menuItems.findIndex((i) => i.id === where.id);
        if (idx !== -1) menuItems.splice(idx, 1);
      },
    },
    _db: { menuItems, auditLogs },
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
// Tests: Phase 7 Menu & Product Management
// =========================================================================

test('Phase 7 Menu: Product Creation with Veg Classification & Variants', async () => {
  const mockPrisma = createMockPrisma();
  const tenantService = new TenantService(mockPrisma);
  const menuService = new MenuService(mockPrisma);

  const onboard = await tenantService.onboardTenant({
    ownerName: 'Cafe Manager',
    ownerEmail: 'mgr@cafe.com',
    ownerPassword: 'StrongPassword123!',
    cafeName: 'Gourmet Cafe',
    cafeSlug: 'gourmet-cafe',
    branchName: 'Main Bistro',
    branchCode: 'MAIN',
    branchAddress: 'MG Road',
    branchCity: 'Bengaluru',
    branchState: 'KA',
    branchPostalCode: '560001',
    plan: 'PRO',
  });

  const item = await menuService.createMenuItem(onboard.tenant.id, onboard.owner.id, {
    name: 'Peri Peri Crispy Burger',
    description: 'Crispy fried fillet tossed in hot peri peri dust',
    priceCents: 16900, // ₹169.00
    categorySlug: 'burgers',
    categoryName: 'Burgers',
    isVeg: false,
    isBestseller: true,
    variants: [
      { name: 'Regular', priceCents: 16900 },
      { name: 'Double Patty', priceCents: 22900 },
    ],
    addOns: [{ name: 'Extra Cheddar Cheese Slice', priceCents: 2500 }],
    tags: ['crispy', 'spicy'],
    available: true,
    prepTimeMinutes: 12,
  });

  assert.ok(item.id);
  assert.equal(item.name, 'Peri Peri Crispy Burger');
  assert.equal(item.priceCents, 16900);
  assert.equal(item.isVeg, false);
  assert.equal(item.isBestseller, true);
  assert.equal((item.variants as any[])?.length, 2);
});

test('Phase 7 Menu: Server-Side Price Validation Rejects Zero or Negative Price', async () => {
  const mockPrisma = createMockPrisma();
  const menuService = new MenuService(mockPrisma);

  await assert.rejects(
    async () => {
      await menuService.createMenuItem('tenant_123', 'usr_123', {
        name: 'Invalid Price Item',
        description: 'Testing price guard',
        priceCents: 50, // Less than 100 paise
        categorySlug: 'beverages',
        categoryName: 'Beverages',
        isVeg: true,
        isBestseller: false,
        variants: [],
        addOns: [],
        tags: [],
        available: true,
        prepTimeMinutes: 5,
      });
    },
    (err: any) => err.code === 'INVALID_PRICE' && err.statusCode === 400,
  );
});

test('Phase 7 Menu: Out-of-Stock Management Toggle', async () => {
  const mockPrisma = createMockPrisma();
  const tenantService = new TenantService(mockPrisma);
  const menuService = new MenuService(mockPrisma);

  const onboard = await tenantService.onboardTenant({
    ownerName: 'Chef Owner',
    ownerEmail: 'chef@cafe.com',
    ownerPassword: 'StrongPassword123!',
    cafeName: 'City Bistro',
    cafeSlug: 'city-bistro',
    branchName: 'City Center',
    branchCode: 'CC',
    branchAddress: 'Main St',
    branchCity: 'Chennai',
    branchState: 'TN',
    branchPostalCode: '600001',
    plan: 'PRO',
  });

  const item = await menuService.createMenuItem(onboard.tenant.id, onboard.owner.id, {
    name: 'Oreo Milkshake',
    description: 'Thick shake with crushed cookies',
    priceCents: 13900,
    categorySlug: 'milkshakes',
    categoryName: 'Milkshakes',
    isVeg: true,
    isBestseller: true,
    variants: [],
    addOns: [],
    tags: [],
    available: true,
    prepTimeMinutes: 8,
  });

  assert.equal(item.available, true);

  // Mark out of stock (e.g. Milk run out in kitchen)
  const updated = await menuService.updateAvailability(
    onboard.tenant.id,
    item.id,
    onboard.owner.id,
    false,
    'Oreo cookies out of stock',
  );

  assert.equal(updated.available, false);

  // Mark back in stock
  const backInStock = await menuService.updateAvailability(
    onboard.tenant.id,
    item.id,
    onboard.owner.id,
    true,
  );

  assert.equal(backInStock.available, true);
});

test('Phase 7 Menu: Cross-Tenant Menu Modification Protection', async () => {
  const mockPrisma = createMockPrisma();
  const tenantService = new TenantService(mockPrisma);
  const menuService = new MenuService(mockPrisma);

  // Tenant 1
  const tenant1 = await tenantService.onboardTenant({
    ownerName: 'Owner 1',
    ownerEmail: 'o1@cafe.com',
    ownerPassword: 'StrongPassword123!',
    cafeName: 'Cafe One',
    cafeSlug: 'cafe-one',
    branchName: 'Branch 1',
    branchCode: 'B1',
    branchAddress: 'Address 1',
    branchCity: 'City 1',
    branchState: 'TN',
    branchPostalCode: '600001',
    plan: 'PRO',
  });

  // Tenant 2
  const tenant2 = await tenantService.onboardTenant({
    ownerName: 'Owner 2',
    ownerEmail: 'o2@cafe.com',
    ownerPassword: 'StrongPassword123!',
    cafeName: 'Cafe Two',
    cafeSlug: 'cafe-two',
    branchName: 'Branch 2',
    branchCode: 'B2',
    branchAddress: 'Address 2',
    branchCity: 'City 2',
    branchState: 'TN',
    branchPostalCode: '600002',
    plan: 'PRO',
  });

  // Tenant 1 creates an item
  const item1 = await menuService.createMenuItem(tenant1.tenant.id, tenant1.owner.id, {
    name: 'Special Biryani',
    description: 'Dum cooked',
    priceCents: 19900,
    categorySlug: 'indian-specials',
    categoryName: 'Indian Specials',
    isVeg: false,
    isBestseller: true,
    variants: [],
    addOns: [],
    tags: [],
    available: true,
    prepTimeMinutes: 20,
  });

  // Tenant 2 owner attempts to delete or modify Tenant 1's item -> Must throw 404
  await assert.rejects(
    async () => {
      await menuService.deleteMenuItem(tenant2.tenant.id, item1.id, tenant2.owner.id);
    },
    (err: any) => err.code === 'ITEM_NOT_FOUND' && err.statusCode === 404,
  );
});
