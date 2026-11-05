-- AlterTable
ALTER TABLE "public"."MenuItem" ADD COLUMN     "addOns" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "categoryName" VARCHAR(100) NOT NULL DEFAULT 'Beverages',
ADD COLUMN     "categorySlug" VARCHAR(50) NOT NULL DEFAULT 'beverages',
ADD COLUMN     "imageUrl" VARCHAR(500),
ADD COLUMN     "isBestseller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVeg" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prepTimeMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "variants" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "category" SET DEFAULT 'coffee';

-- CreateIndex
CREATE INDEX "MenuItem_tenantId_categorySlug_idx" ON "public"."MenuItem"("tenantId", "categorySlug");
