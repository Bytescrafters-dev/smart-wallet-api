-- CreateEnum
CREATE TYPE "StockOrderStatus" AS ENUM ('CREATED', 'RECEIVED', 'PARTIALLY_RECEIVED', 'REJECTED');

-- DropTable (lines first due to FK)
DROP TABLE "StockReceiptLine";
DROP TABLE "StockReceipt";

-- Recreate InventoryMovementRefType without STOCK_RECEIPT, with STOCK_ORDER
ALTER TYPE "InventoryMovementRefType" ADD VALUE 'STOCK_ORDER';
-- Note: PostgreSQL does not support removing enum values.
-- STOCK_RECEIPT had no rows in InventoryMovement, so it is safe to leave as an
-- unused value. It will never be written again — application code now uses STOCK_ORDER.

-- CreateTable
CREATE TABLE "StockOrder" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "receivedById" TEXT NOT NULL,
    "supplierId" TEXT,
    "invoiceRef" TEXT,
    "status" "StockOrderStatus" NOT NULL DEFAULT 'CREATED',
    "note" TEXT,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockOrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "orderedQty" INTEGER NOT NULL,
    "receivedQty" INTEGER,
    "costPerUnit" INTEGER,

    CONSTRAINT "StockOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockOrder_storeId_idx" ON "StockOrder"("storeId");
CREATE INDEX "StockOrder_supplierId_idx" ON "StockOrder"("supplierId");
CREATE INDEX "StockOrder_status_idx" ON "StockOrder"("status");
CREATE INDEX "StockOrder_receivedAt_idx" ON "StockOrder"("receivedAt");

-- CreateIndex
CREATE INDEX "StockOrderLine_orderId_idx" ON "StockOrderLine"("orderId");
CREATE INDEX "StockOrderLine_variantId_idx" ON "StockOrderLine"("variantId");

-- AddForeignKey
ALTER TABLE "StockOrder" ADD CONSTRAINT "StockOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockOrder" ADD CONSTRAINT "StockOrder_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockOrder" ADD CONSTRAINT "StockOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOrderLine" ADD CONSTRAINT "StockOrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "StockOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockOrderLine" ADD CONSTRAINT "StockOrderLine_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
