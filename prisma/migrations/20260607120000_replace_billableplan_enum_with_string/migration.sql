-- ── PlanPrice: plan (BillablePlan enum) → planName (String) ─────────────────

ALTER TABLE "PlanPrice" ADD COLUMN "planName" TEXT;
UPDATE "PlanPrice" SET "planName" = "plan"::TEXT;
ALTER TABLE "PlanPrice" ALTER COLUMN "planName" SET NOT NULL;
ALTER TABLE "PlanPrice" DROP COLUMN "plan";

DROP INDEX IF EXISTS "PlanPrice_plan_billingCycle_currency_key";
DROP INDEX IF EXISTS "PlanPrice_plan_idx";
CREATE UNIQUE INDEX "PlanPrice_planName_billingCycle_currency_key" ON "PlanPrice"("planName", "billingCycle", "currency");
CREATE INDEX "PlanPrice_planName_idx" ON "PlanPrice"("planName");

-- ── Tenant: plan (TenantPlan enum) → currentPlanName (String, nullable) ─────

ALTER TABLE "Tenant" ADD COLUMN "currentPlanName" TEXT;
UPDATE "Tenant" SET "currentPlanName" = CASE WHEN "plan"::TEXT = 'TRIAL' THEN NULL ELSE "plan"::TEXT END;
ALTER TABLE "Tenant" DROP COLUMN "plan";

DROP INDEX IF EXISTS "Tenant_plan_idx";
CREATE INDEX "Tenant_currentPlanName_idx" ON "Tenant"("currentPlanName");

-- ── Drop enums ───────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS "BillablePlan";
DROP TYPE IF EXISTS "TenantPlan";
