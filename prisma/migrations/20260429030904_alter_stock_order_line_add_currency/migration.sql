/*
  Warnings:

  - The values [STOCK_RECEIPT] on the enum `InventoryMovementRefType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InventoryMovementRefType_new" AS ENUM ('ORDER', 'STOCK_ORDER', 'STOCK_ADJUSTMENT');
ALTER TABLE "InventoryMovement" ALTER COLUMN "refType" TYPE "InventoryMovementRefType_new" USING ("refType"::text::"InventoryMovementRefType_new");
ALTER TYPE "InventoryMovementRefType" RENAME TO "InventoryMovementRefType_old";
ALTER TYPE "InventoryMovementRefType_new" RENAME TO "InventoryMovementRefType";
DROP TYPE "public"."InventoryMovementRefType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "StockOrder" DROP CONSTRAINT "StockOrder_receivedById_fkey";

-- AlterTable
ALTER TABLE "StockOrderLine" ADD COLUMN     "currency" TEXT;

-- AddForeignKey
ALTER TABLE "StockOrder" ADD CONSTRAINT "StockOrder_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
