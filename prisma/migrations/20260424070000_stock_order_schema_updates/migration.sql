-- AlterTable: make receivedById nullable, add createdById and orderNumber
ALTER TABLE "StockOrder"
  ADD COLUMN "orderNumber" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "createdById" TEXT NOT NULL DEFAULT '',
  ALTER COLUMN "receivedById" DROP NOT NULL;

-- Remove defaults after populating (columns are empty in dev, safe to remove)
ALTER TABLE "StockOrder"
  ALTER COLUMN "orderNumber" DROP DEFAULT,
  ALTER COLUMN "createdById" DROP DEFAULT;

-- CreateTable
CREATE TABLE "StoreSequence" (
    "storeId" TEXT NOT NULL,
    "stockOrderSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoreSequence_pkey" PRIMARY KEY ("storeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockOrder_storeId_orderNumber_key" ON "StockOrder"("storeId", "orderNumber");

-- AddForeignKey
ALTER TABLE "StockOrder" ADD CONSTRAINT "StockOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreSequence" ADD CONSTRAINT "StoreSequence_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
