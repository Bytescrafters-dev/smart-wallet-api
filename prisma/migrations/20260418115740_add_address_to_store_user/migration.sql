/*
  Warnings:

  - You are about to drop the column `email` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Address` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "storeUserId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Address_storeUserId_idx" ON "Address"("storeUserId");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_storeUserId_fkey" FOREIGN KEY ("storeUserId") REFERENCES "StoreUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
