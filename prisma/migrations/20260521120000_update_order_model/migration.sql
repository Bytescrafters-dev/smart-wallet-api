-- AlterTable Order: add orderNumber, createdById, confirmedById, note
ALTER TABLE "Order"
  ADD COLUMN "orderNumber"   TEXT,
  ADD COLUMN "createdById"   TEXT,
  ADD COLUMN "confirmedById" TEXT,
  ADD COLUMN "note"          TEXT;

-- Backfill orderNumber for existing rows (use id as placeholder)
UPDATE "Order" SET "orderNumber" = id WHERE "orderNumber" IS NULL;

-- Make orderNumber NOT NULL now that all rows have a value
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;

-- Foreign keys
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Order_confirmedById_fkey"
    FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Unique and indexes
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_orderNumber_key" UNIQUE ("storeId", "orderNumber");
CREATE INDEX "Order_storeId_idx"        ON "Order"("storeId");
CREATE INDEX "Order_status_idx"         ON "Order"("status");
CREATE INDEX "Order_paymentStatus_idx"  ON "Order"("paymentStatus");
CREATE INDEX "Order_storeUserId_idx"    ON "Order"("storeUserId");

-- AlterTable StoreSequence: add orderSeq
ALTER TABLE "StoreSequence" ADD COLUMN "orderSeq" INTEGER NOT NULL DEFAULT 0;
