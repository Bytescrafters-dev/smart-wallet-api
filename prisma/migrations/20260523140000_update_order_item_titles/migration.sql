-- Add new columns (nullable first for backfill)
ALTER TABLE "OrderItem"
  ADD COLUMN "productTitle" TEXT,
  ADD COLUMN "variantTitle" TEXT;

-- Backfill productTitle from existing title for any existing rows
UPDATE "OrderItem" SET "productTitle" = "title";

-- Make productTitle NOT NULL now that all rows have a value
ALTER TABLE "OrderItem" ALTER COLUMN "productTitle" SET NOT NULL;

-- Drop old combined title column
ALTER TABLE "OrderItem" DROP COLUMN "title";
