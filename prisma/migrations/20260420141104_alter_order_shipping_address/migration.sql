/*
  Warnings:

  - You are about to drop the column `addressToId` on the `Order` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_addressToId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "addressToId",
ADD COLUMN     "shippingAddress1" TEXT,
ADD COLUMN     "shippingAddress2" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingCountry" TEXT,
ADD COLUMN     "shippingPostalCode" TEXT,
ADD COLUMN     "shippingState" TEXT;
