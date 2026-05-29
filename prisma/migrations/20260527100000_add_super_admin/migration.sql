-- CreateEnum
CREATE TYPE "SuperAdminRole" AS ENUM ('OWNER', 'PARTNER', 'MANAGER', 'STAFF');

-- CreateTable
CREATE TABLE "SuperAdmin" (
    "id"                 TEXT NOT NULL,
    "email"              TEXT NOT NULL,
    "passwordHash"       TEXT NOT NULL,
    "firstName"          TEXT NOT NULL,
    "lastName"           TEXT NOT NULL,
    "phone"              TEXT,
    "avatar"             TEXT,
    "role"               "SuperAdminRole" NOT NULL DEFAULT 'STAFF',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "status"             "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById"        TEXT,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperAdminRefreshToken" (
    "id"           TEXT NOT NULL,
    "superAdminId" TEXT NOT NULL,
    "tokenId"      TEXT NOT NULL,
    "revokedAt"    TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperAdminRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_email_key" ON "SuperAdmin"("email");

-- CreateIndex
CREATE INDEX "SuperAdmin_role_idx" ON "SuperAdmin"("role");

-- CreateIndex
CREATE INDEX "SuperAdmin_status_idx" ON "SuperAdmin"("status");

-- CreateIndex
CREATE INDEX "SuperAdmin_createdById_idx" ON "SuperAdmin"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdminRefreshToken_tokenId_key" ON "SuperAdminRefreshToken"("tokenId");

-- AddForeignKey
ALTER TABLE "SuperAdmin" ADD CONSTRAINT "SuperAdmin_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuperAdminRefreshToken" ADD CONSTRAINT "SuperAdminRefreshToken_superAdminId_fkey"
    FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
