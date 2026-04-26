-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('RESERVED', 'UNRESERVED', 'SALE');

-- CreateEnum
CREATE TYPE "InventoryMovementActorType" AS ENUM ('SYSTEM', 'ADMIN');

-- CreateEnum
CREATE TYPE "InventoryMovementRefType" AS ENUM ('ORDER');

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "delta" INTEGER NOT NULL,
    "refType" "InventoryMovementRefType" NOT NULL,
    "refId" TEXT NOT NULL,
    "actorType" "InventoryMovementActorType" NOT NULL DEFAULT 'SYSTEM',
    "actorId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryMovement_variantId_idx" ON "InventoryMovement"("variantId");

-- CreateIndex
CREATE INDEX "InventoryMovement_refType_refId_idx" ON "InventoryMovement"("refType", "refId");

-- CreateIndex
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
