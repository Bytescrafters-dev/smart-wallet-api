-- CreateEnum
CREATE TYPE "BillablePlan" AS ENUM ('BASIC', 'PLUS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MANUAL', 'STRIPE');

-- CreateTable
CREATE TABLE "PlanPrice" (
    "id"           TEXT NOT NULL,
    "plan"         "BillablePlan" NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "currency"     TEXT NOT NULL,
    "amount"       INTEGER NOT NULL,
    "features"     JSONB,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSubscription" (
    "id"                   TEXT NOT NULL,
    "tenantId"             TEXT NOT NULL,
    "planPriceId"          TEXT NOT NULL,
    "status"               "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "currentPeriodStart"   TIMESTAMP(3),
    "currentPeriodEnd"     TIMESTAMP(3),
    "endedAt"              TIMESTAMP(3),
    "cancelAtPeriodEnd"    BOOLEAN NOT NULL DEFAULT false,
    "daysUntilDue"         INTEGER NOT NULL DEFAULT 3,
    "createdById"          TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantInvoice" (
    "id"              TEXT NOT NULL,
    "tenantId"        TEXT NOT NULL,
    "subscriptionId"  TEXT NOT NULL,
    "invoiceNumber"   TEXT NOT NULL,
    "amount"          INTEGER NOT NULL,
    "currency"        TEXT NOT NULL,
    "status"          "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate"         TIMESTAMP(3) NOT NULL,
    "paidAt"          TIMESTAMP(3),
    "paidById"        TEXT,
    "paymentMethod"   "PaymentMethod" NOT NULL DEFAULT 'MANUAL',
    "notes"           TEXT,
    "stripeInvoiceId" TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanPrice_plan_billingCycle_currency_key" ON "PlanPrice"("plan", "billingCycle", "currency");
CREATE INDEX "PlanPrice_plan_idx" ON "PlanPrice"("plan");
CREATE INDEX "PlanPrice_isActive_idx" ON "PlanPrice"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TenantInvoice_invoiceNumber_key" ON "TenantInvoice"("invoiceNumber");
CREATE INDEX "TenantSubscription_tenantId_idx" ON "TenantSubscription"("tenantId");
CREATE INDEX "TenantSubscription_planPriceId_idx" ON "TenantSubscription"("planPriceId");
CREATE INDEX "TenantSubscription_status_idx" ON "TenantSubscription"("status");
CREATE INDEX "TenantSubscription_endedAt_idx" ON "TenantSubscription"("endedAt");
CREATE INDEX "TenantSubscription_currentPeriodEnd_idx" ON "TenantSubscription"("currentPeriodEnd");
CREATE INDEX "TenantInvoice_tenantId_idx" ON "TenantInvoice"("tenantId");
CREATE INDEX "TenantInvoice_subscriptionId_idx" ON "TenantInvoice"("subscriptionId");
CREATE INDEX "TenantInvoice_status_idx" ON "TenantInvoice"("status");
CREATE INDEX "TenantInvoice_dueDate_idx" ON "TenantInvoice"("dueDate");

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_planPriceId_fkey"
    FOREIGN KEY ("planPriceId") REFERENCES "PlanPrice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TenantInvoice" ADD CONSTRAINT "TenantInvoice_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TenantInvoice" ADD CONSTRAINT "TenantInvoice_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "TenantSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TenantInvoice" ADD CONSTRAINT "TenantInvoice_paidById_fkey"
    FOREIGN KEY ("paidById") REFERENCES "SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
