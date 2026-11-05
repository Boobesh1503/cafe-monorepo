import type { PrismaClient } from '@prisma/client';
import { AppError } from '../security/errorHandler.js';
import { TenantAuditService } from '../tenant/auditService.js';
import type { CreateMenuItemInput, UpdateMenuItemInput } from './schemas.js';

export class MenuService {
  private readonly audit: TenantAuditService;

  constructor(private readonly prisma: PrismaClient) {
    this.audit = new TenantAuditService(prisma);
  }

  /**
   * Retrieves public/tenant-scoped menu with branch and dietary filters.
   */
  async listMenuItems(
    tenantId?: string,
    filter: {
      branchId?: string;
      categorySlug?: string;
      isVeg?: boolean;
      available?: boolean;
      search?: string;
    } = {},
  ) {
    const where: any = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (filter.branchId) {
      // Return items available across all branches OR specifically assigned to this branch
      where.OR = [{ branchId: null }, { branchId: filter.branchId }];
    }

    if (filter.categorySlug) {
      where.categorySlug = filter.categorySlug.toLowerCase();
    }

    if (filter.isVeg !== undefined) {
      where.isVeg = filter.isVeg;
    }

    if (filter.available !== undefined) {
      where.available = filter.available;
    }

    if (filter.search?.trim()) {
      const q = filter.search.trim();
      where.AND = [
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { categoryName: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    return this.prisma.menuItem.findMany({
      where,
      orderBy: [{ available: 'desc' }, { createdAt: 'desc' }],
      include: {
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  /**
   * Retrieves a single menu item with tenant ownership check.
   */
  async getMenuItemById(tenantId: string, itemId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, tenantId },
      include: { branch: true },
    });

    if (!item) {
      throw new AppError('ITEM_NOT_FOUND', 'Menu item not found or does not belong to your cafe.', 404);
    }

    return item;
  }

  /**
   * Creates a new menu item with tenant and branch validation.
   */
  async createMenuItem(
    tenantId: string,
    userId: string,
    input: CreateMenuItemInput,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ) {
    // 1. If branchId specified, verify branch belongs to this tenant
    if (input.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: input.branchId, tenantId },
      });
      if (!branch) {
        throw new AppError('INVALID_BRANCH', 'The assigned branch does not belong to your cafe account.', 400);
      }
    }

    // 2. Server-side price validation
    if (input.priceCents < 100) {
      throw new AppError('INVALID_PRICE', 'Menu item price must be at least ₹1.00 (100 paise).', 400);
    }

    const item = await this.prisma.menuItem.create({
      data: {
        tenantId,
        branchId: input.branchId ?? null,
        name: input.name,
        description: input.description,
        priceCents: input.priceCents,
        categorySlug: input.categorySlug,
        categoryName: input.categoryName,
        imageUrl: input.imageUrl ?? null,
        isVeg: input.isVeg,
        isBestseller: input.isBestseller,
        variants: (input.variants as any) ?? [],
        addOns: (input.addOns as any) ?? [],
        prepTimeMinutes: input.prepTimeMinutes,
        tags: input.tags,
        available: input.available,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'MENU_ITEM_CREATED',
      entity: 'MenuItem',
      entityId: item.id,
      metadata: { name: item.name, priceCents: item.priceCents, category: item.categorySlug },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return item;
  }

  /**
   * Updates an existing menu item with ownership verification.
   */
  async updateMenuItem(
    tenantId: string,
    itemId: string,
    userId: string,
    input: UpdateMenuItemInput,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ) {
    const existing = await this.prisma.menuItem.findFirst({
      where: { id: itemId, tenantId },
    });

    if (!existing) {
      throw new AppError('ITEM_NOT_FOUND', 'Menu item not found or belongs to another tenant.', 404);
    }

    if (input.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: input.branchId, tenantId },
      });
      if (!branch) {
        throw new AppError('INVALID_BRANCH', 'Assigned branch does not belong to your cafe.', 400);
      }
    }

    if (input.priceCents !== undefined && input.priceCents < 100) {
      throw new AppError('INVALID_PRICE', 'Price must be at least 100 paise.', 400);
    }

    const updated = await this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
        ...(input.categorySlug ? { categorySlug: input.categorySlug } : {}),
        ...(input.categoryName ? { categoryName: input.categoryName } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.isVeg !== undefined ? { isVeg: input.isVeg } : {}),
        ...(input.isBestseller !== undefined ? { isBestseller: input.isBestseller } : {}),
        ...(input.branchId !== undefined ? { branchId: input.branchId } : {}),
        ...(input.variants ? { variants: input.variants as any } : {}),
        ...(input.addOns ? { addOns: input.addOns as any } : {}),
        ...(input.prepTimeMinutes !== undefined ? { prepTimeMinutes: input.prepTimeMinutes } : {}),
        ...(input.tags ? { tags: input.tags } : {}),
        ...(input.available !== undefined ? { available: input.available } : {}),
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'MENU_ITEM_UPDATED',
      entity: 'MenuItem',
      entityId: itemId,
      metadata: { input },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return updated;
  }

  /**
   * Toggles out-of-stock availability with instant reflection.
   */
  async updateAvailability(
    tenantId: string,
    itemId: string,
    userId: string,
    available: boolean,
    reason?: string,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, tenantId },
    });

    if (!item) {
      throw new AppError('ITEM_NOT_FOUND', 'Menu item not found.', 404);
    }

    const updated = await this.prisma.menuItem.update({
      where: { id: itemId },
      data: { available },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: available ? 'ITEM_MARKED_IN_STOCK' : 'ITEM_MARKED_OUT_OF_STOCK',
      entity: 'MenuItem',
      entityId: itemId,
      metadata: { available, reason, itemName: item.name },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return updated;
  }

  /**
   * Deletes a menu item.
   */
  async deleteMenuItem(
    tenantId: string,
    itemId: string,
    userId: string,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, tenantId },
    });

    if (!item) {
      throw new AppError('ITEM_NOT_FOUND', 'Item not found or belongs to another tenant.', 404);
    }

    await this.prisma.menuItem.delete({
      where: { id: itemId },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'MENU_ITEM_DELETED',
      entity: 'MenuItem',
      entityId: itemId,
      metadata: { name: item.name },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Seeds the complete 67-item Foodie Café menu for a tenant!
   */
  async seedFoodieCafeMenu(tenantId: string, userId: string, items: any[]) {
    let createdCount = 0;
    for (const it of items) {
      await this.prisma.menuItem.create({
        data: {
          tenantId,
          name: it.name,
          description: it.description,
          priceCents: it.price * 100, // Convert INR rupees to cents/paise
          categorySlug: it.category,
          categoryName: it.categoryName,
          imageUrl: it.image,
          isVeg: it.isVeg,
          isBestseller: !!it.isBestseller,
          available: it.available ?? true,
          variants: (it.customizations?.sizes as any) ?? [],
          addOns: (it.customizations?.addOns as any) ?? [],
        },
      });
      createdCount++;
    }

    await this.audit.log({
      tenantId,
      userId,
      action: 'MENU_SEEDED',
      entity: 'MenuItem',
      metadata: { count: createdCount },
    });

    return { createdCount };
  }
}

