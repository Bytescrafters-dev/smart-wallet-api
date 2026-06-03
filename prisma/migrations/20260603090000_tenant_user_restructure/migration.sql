-- Add tenantId to User
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old FK and unique index on Tenant.userId
ALTER TABLE "Tenant" DROP CONSTRAINT IF EXISTS "Tenant_userId_fkey";
DROP INDEX IF EXISTS "Tenant_userId_key";

-- Drop userId column from Tenant
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "userId";
