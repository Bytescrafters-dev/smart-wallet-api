CREATE TYPE "LeadSource" AS ENUM ('FACEBOOK', 'GOOGLE', 'INSTAGRAM', 'WHATSAPP', 'TIKTOK', 'OTHER');
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'NO_ANSWER', 'INTERESTED', 'ORDERED', 'NOT_INTERESTED');

CREATE TABLE "Lead" (
    "id"           TEXT NOT NULL,
    "storeId"      TEXT NOT NULL,
    "fullName"     TEXT NOT NULL,
    "phone"        TEXT NOT NULL,
    "email"        TEXT,
    "address1"     TEXT,
    "address2"     TEXT,
    "city"         TEXT,
    "state"        TEXT,
    "country"      TEXT,
    "postalCode"   TEXT,
    "source"       "LeadSource" NOT NULL,
    "productSKUs"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status"       "LeadStatus" NOT NULL DEFAULT 'NEW',
    "note"         TEXT,
    "followUpDate" TIMESTAMP(3),
    "assignedToId" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_storeId_idx" ON "Lead"("storeId");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
