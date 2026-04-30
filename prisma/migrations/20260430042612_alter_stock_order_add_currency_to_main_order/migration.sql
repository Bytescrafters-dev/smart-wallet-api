/*
  Warnings:

  - You are about to drop the column `currency` on the `StockOrderLine` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StockOrder" ADD COLUMN     "currency" TEXT;

-- AlterTable
ALTER TABLE "StockOrderLine" DROP COLUMN "currency";
