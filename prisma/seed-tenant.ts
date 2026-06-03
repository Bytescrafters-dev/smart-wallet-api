import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient, TenantPlan, TenantStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const email = 'info.bytecrafters@gmail.com';

  const existing = await prisma.tenant.findUnique({ where: { email } });
  if (existing) {
    console.log(`Tenant ${email} already exists, skipping.`);
    return;
  }

  await prisma.tenant.create({
    data: {
      email,
      companyName: 'Bytecrafters Ltd',
      firstName: 'Ravindu',
      lastName: 'Landekumbura',
      phone: '',
      plan: TenantPlan.BASIC,
      status: TenantStatus.ACTIVE,
    },
  });

  console.log('Tenant created.');
}

main().finally(() => prisma.$disconnect());
