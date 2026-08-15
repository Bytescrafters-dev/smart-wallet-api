-- CreateEnum
CREATE TYPE "ProductImageStatus" AS ENUM ('PENDING', 'READY');

-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "productSKUs" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "status" "ProductImageStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "BillingSequence" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "invoiceSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BillingSequence_pkey" PRIMARY KEY ("id")
);
