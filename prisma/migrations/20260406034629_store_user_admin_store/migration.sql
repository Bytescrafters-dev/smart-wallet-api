/*
  Warnings:

  - You are about to drop the column `userId` on the `Cart` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'MANAGER', 'VIEWER');

-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropIndex
DROP INDEX "User_createdAt_idx";

-- DropIndex
DROP INDEX "User_role_idx";

-- DropIndex
DROP INDEX "User_status_idx";

-- DropIndex
DROP INDEX "User_status_role_createdAt_id_idx";

-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "userId",
ADD COLUMN     "storeUserId" TEXT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "userId",
ADD COLUMN     "storeUserId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatar",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "phone",
DROP COLUMN "role",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "StoreUser" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminStore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreUser_storeId_idx" ON "StoreUser"("storeId");

-- CreateIndex
CREATE INDEX "StoreUser_status_idx" ON "StoreUser"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StoreUser_storeId_email_key" ON "StoreUser"("storeId", "email");

-- CreateIndex
CREATE INDEX "AdminStore_userId_idx" ON "AdminStore"("userId");

-- CreateIndex
CREATE INDEX "AdminStore_storeId_idx" ON "AdminStore"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminStore_userId_storeId_key" ON "AdminStore"("userId", "storeId");

-- AddForeignKey
ALTER TABLE "StoreUser" ADD CONSTRAINT "StoreUser_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminStore" ADD CONSTRAINT "AdminStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminStore" ADD CONSTRAINT "AdminStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_storeUserId_fkey" FOREIGN KEY ("storeUserId") REFERENCES "StoreUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeUserId_fkey" FOREIGN KEY ("storeUserId") REFERENCES "StoreUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
