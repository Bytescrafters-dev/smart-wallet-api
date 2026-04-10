-- CreateTable
CREATE TABLE "StoreUserRefreshToken" (
    "id" TEXT NOT NULL,
    "storeUserId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreUserRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreUserRefreshToken_tokenId_key" ON "StoreUserRefreshToken"("tokenId");

-- AddForeignKey
ALTER TABLE "StoreUserRefreshToken" ADD CONSTRAINT "StoreUserRefreshToken_storeUserId_fkey" FOREIGN KEY ("storeUserId") REFERENCES "StoreUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
