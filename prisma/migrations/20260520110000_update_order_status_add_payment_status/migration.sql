-- CreateEnum PaymentStatus (idempotent in case of prior partial run)
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'COD', 'PAID', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Convert status column to text so we can freely migrate values
-- before recreating the enum (avoids the "new enum value not committed" error)
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE TEXT;

-- Migrate old OrderStatus values to new equivalents
UPDATE "Order" SET status = 'PENDING'   WHERE status = 'PAID';
UPDATE "Order" SET status = 'DELIVERED' WHERE status = 'FULFILLED';

-- Drop old enum and create the new one
DROP TYPE IF EXISTS "OrderStatus";
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELED');

-- Cast column back to the new enum and restore default
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus" USING status::"OrderStatus";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Add paymentStatus column
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
