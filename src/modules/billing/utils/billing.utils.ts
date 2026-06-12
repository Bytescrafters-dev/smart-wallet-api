import { BillingCycle } from '@prisma/client';

export function addBillingCycle(date: Date, cycle: BillingCycle): Date {
  const d = new Date(date);
  switch (cycle) {
    case BillingCycle.MONTHLY:
      d.setMonth(d.getMonth() + 1);
      break;
    case BillingCycle.QUARTERLY:
      d.setMonth(d.getMonth() + 3);
      break;
    case BillingCycle.SEMI_ANNUAL:
      d.setMonth(d.getMonth() + 6);
      break;
    case BillingCycle.ANNUAL:
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

export function calcDueDate(periodEnd: Date, daysUntilDue: number): Date {
  const d = new Date(periodEnd);
  d.setDate(d.getDate() + daysUntilDue);
  return d;
}

export function generateInvoiceNumber(count: number): string {
  return `INV-${String(count + 1).padStart(6, '0')}`;
}
