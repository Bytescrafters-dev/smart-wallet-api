ALTER TABLE "StockOrder"
  ADD COLUMN "rejectedById" TEXT,
  ADD COLUMN "rejectedAt"   TIMESTAMP(3);

ALTER TABLE "StockOrder"
  ADD CONSTRAINT "StockOrder_rejectedById_fkey"
  FOREIGN KEY ("rejectedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
