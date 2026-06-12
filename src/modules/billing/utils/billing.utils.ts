import { BillingCycle, Prisma } from '@prisma/client';

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

// Atomically increments the global invoice sequence and returns the formatted
// invoice number. Must be called inside a Prisma transaction.
export async function nextInvoiceNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const seq = await tx.billingSequence.upsert({
    where: { id: 1 },
    create: { id: 1, invoiceSeq: 1 },
    update: { invoiceSeq: { increment: 1 } },
    select: { invoiceSeq: true },
  });
  return `INV-${String(seq.invoiceSeq).padStart(6, '0')}`;
}
