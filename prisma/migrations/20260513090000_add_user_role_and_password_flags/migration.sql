ALTER TABLE "User" ADD COLUMN "role" "AdminRole";
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "createdById" TEXT;

-- Backfill existing users as OWNER before enforcing NOT NULL
UPDATE "User" SET "role" = 'OWNER';

ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;

ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_createdById_idx" ON "User"("createdById");
