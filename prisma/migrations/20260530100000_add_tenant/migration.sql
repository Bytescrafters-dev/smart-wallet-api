-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('TRIAL', 'BASIC', 'PLUS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id"          TEXT NOT NULL,
    "companyName" TEXT,
    "firstName"   TEXT NOT NULL,
    "lastName"    TEXT NOT NULL,
    "phone"       TEXT,
    "email"       TEXT NOT NULL,
    "plan"        "TenantPlan"   NOT NULL DEFAULT 'TRIAL',
    "status"      "TenantStatus" NOT NULL DEFAULT 'PENDING',
    "trialEndsAt" TIMESTAMP(3),
    "notes"       TEXT,
    "createdById" TEXT,
    "userId"      TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_email_key" ON "Tenant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_userId_key" ON "Tenant"("userId");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "Tenant_plan_idx" ON "Tenant"("plan");

-- CreateIndex
CREATE INDEX "Tenant_createdById_idx" ON "Tenant"("createdById");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
