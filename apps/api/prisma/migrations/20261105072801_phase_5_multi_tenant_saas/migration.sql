-- CreateEnum
CREATE TYPE "public"."TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('FREE_TRIAL', 'STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."TenantMemberRole" AS ENUM ('OWNER', 'MANAGER', 'KITCHEN_STAFF', 'CASHIER', 'WAITER');

-- CreateEnum
CREATE TYPE "public"."MemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "public"."MenuItem" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "tenantId" TEXT;

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(63) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "status" "public"."TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "subscriptionPlan" "public"."SubscriptionPlan" NOT NULL DEFAULT 'FREE_TRIAL',
    "subscriptionExpiresAt" TIMESTAMP(3),
    "branding" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Branch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(255),
    "address" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(20) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "openingHours" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantMembership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."TenantMemberRole" NOT NULL DEFAULT 'MANAGER',
    "status" "public"."MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BranchStaffAssignment" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchStaffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(60) NOT NULL,
    "entityId" VARCHAR(100),
    "metadata" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "public"."Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "public"."Tenant"("status");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "public"."Tenant"("slug");

-- CreateIndex
CREATE INDEX "Branch_tenantId_isActive_idx" ON "public"."Branch"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_tenantId_code_key" ON "public"."Branch"("tenantId", "code");

-- CreateIndex
CREATE INDEX "TenantMembership_tenantId_role_idx" ON "public"."TenantMembership"("tenantId", "role");

-- CreateIndex
CREATE INDEX "TenantMembership_userId_idx" ON "public"."TenantMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantMembership_tenantId_userId_key" ON "public"."TenantMembership"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "BranchStaffAssignment_branchId_idx" ON "public"."BranchStaffAssignment"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchStaffAssignment_membershipId_branchId_key" ON "public"."BranchStaffAssignment"("membershipId", "branchId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "public"."AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_action_idx" ON "public"."AuditLog"("tenantId", "action");

-- CreateIndex
CREATE INDEX "MenuItem_tenantId_available_createdAt_idx" ON "public"."MenuItem"("tenantId", "available", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Branch" ADD CONSTRAINT "Branch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantMembership" ADD CONSTRAINT "TenantMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantMembership" ADD CONSTRAINT "TenantMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchStaffAssignment" ADD CONSTRAINT "BranchStaffAssignment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "public"."TenantMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BranchStaffAssignment" ADD CONSTRAINT "BranchStaffAssignment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuItem" ADD CONSTRAINT "MenuItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuItem" ADD CONSTRAINT "MenuItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
