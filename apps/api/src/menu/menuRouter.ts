import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { validateRequest } from '../security/validation.js';
import { requireAuth } from '../auth/authMiddleware.js';
import { createTenantMiddleware } from '../tenant/tenantMiddleware.js';
import { MenuService } from './menuService.js';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  updateAvailabilitySchema,
} from './schemas.js';

export function createMenuRouter(prisma: PrismaClient) {
  const router = Router();
  const service = new MenuService(prisma);
  const { resolveTenant, requireTenantMember } = createTenantMiddleware(prisma);

  // =========================================================================
  // Public Menu Queries
  // =========================================================================

  /**
   * GET /api/v1/menu/items (or /api/v1/tenants/:tenantSlug/menu)
   * Public storefront query for menu items.
   */
  router.get('/items', async (req, res, next) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const categorySlug = req.query.category as string | undefined;
      const isVegParam = req.query.isVeg as string | undefined;
      const isVeg = isVegParam !== undefined ? isVegParam === 'true' : undefined;
      const search = req.query.search as string | undefined;

      const items = await service.listMenuItems(undefined, {
        branchId,
        categorySlug,
        isVeg,
        available: true,
        search,
      });

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================================
  // Protected Tenant Menu Management Routes
  // =========================================================================
  const protectedMenuRouter = Router();
  protectedMenuRouter.use(requireAuth);
  protectedMenuRouter.use(resolveTenant);

  /**
   * GET /api/v1/tenants/current/menu
   * Lists all items (including out-of-stock) for tenant management.
   */
  protectedMenuRouter.get(
    '/',
    requireTenantMember(),
    async (req, res, next) => {
      try {
        const branchId = req.query.branchId as string | undefined;
        const categorySlug = req.query.category as string | undefined;

        const items = await service.listMenuItems(req.tenant!.id, {
          branchId,
          categorySlug,
        });

        res.json({
          success: true,
          data: items,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * POST /api/v1/tenants/current/menu
   * Creates a new menu product (Admin & Manager only).
   */
  protectedMenuRouter.post(
    '/',
    requireTenantMember(['OWNER', 'MANAGER']),
    validateRequest({ body: createMenuItemSchema }),
    async (req, res, next) => {
      try {
        const item = await service.createMenuItem(
          req.tenant!.id,
          req.user!.userId,
          req.body,
          { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        );

        res.status(201).json({
          success: true,
          message: `Menu item "${item.name}" created successfully.`,
          data: item,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * PATCH /api/v1/tenants/current/menu/:itemId
   * Updates menu item details and pricing (Admin & Manager only).
   */
  protectedMenuRouter.patch(
    '/:itemId',
    requireTenantMember(['OWNER', 'MANAGER']),
    validateRequest({ body: updateMenuItemSchema }),
    async (req, res, next) => {
      try {
        const updated = await service.updateMenuItem(
          req.tenant!.id,
          req.params.itemId as string,
          req.user!.userId,
          req.body,
          { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        );

        res.json({
          success: true,
          message: `Menu item "${updated.name}" updated.`,
          data: updated,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * PATCH /api/v1/tenants/current/menu/:itemId/availability
   * Out-of-stock management: Toggles live item availability.
   * Accessible by Kitchen Staff, Cashier, Manager & Owner.
   */
  protectedMenuRouter.patch(
    '/:itemId/availability',
    requireTenantMember(['OWNER', 'MANAGER', 'KITCHEN_STAFF', 'CASHIER']),
    validateRequest({ body: updateAvailabilitySchema }),
    async (req, res, next) => {
      try {
        const updated = await service.updateAvailability(
          req.tenant!.id,
          req.params.itemId as string,
          req.user!.userId,
          req.body.available,
          req.body.reason,
          { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        );

        res.json({
          success: true,
          message: `Item "${updated.name}" is now marked as ${
            updated.available ? 'IN STOCK' : 'OUT OF STOCK'
          }.`,
          data: updated,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * DELETE /api/v1/tenants/current/menu/:itemId
   * Deletes a menu item (Owner only).
   */
  protectedMenuRouter.delete(
    '/:itemId',
    requireTenantMember(['OWNER']),
    async (req, res, next) => {
      try {
        await service.deleteMenuItem(
          req.tenant!.id,
          req.params.itemId as string,
          req.user!.userId,
          { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        );

        res.json({
          success: true,
          message: 'Menu item deleted successfully.',
        });
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * POST /api/v1/tenants/current/menu/seed
   * Seeds all 67 Foodie Café dishes into tenant database!
   */
  protectedMenuRouter.post(
    '/seed',
    requireTenantMember(['OWNER']),
    async (req, res, next) => {
      try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
          return res.status(400).json({ error: 'items must be an array of menu items' });
        }

        const result = await service.seedFoodieCafeMenu(
          req.tenant!.id,
          req.user!.userId,
          items,
        );

        res.json({
          success: true,
          message: `Successfully seeded ${result.createdCount} menu items for your cafe!`,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return { router, protectedMenuRouter };
}

