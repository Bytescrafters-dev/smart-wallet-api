import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  }),
});

async function main() {
  const email = 'info.bytecrafters@gmail.com';
  const password = 'superadmin123';

  const existing = await prisma.superAdmin.findUnique({ where: { email } });
  if (existing) {
    console.log(`SuperAdmin ${email} already exists, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.superAdmin.create({
    data: {
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'OWNER',
      mustChangePassword: true,
    },
  });

  console.log(`SuperAdmin created: ${email} / ${password}`);
  console.log('Change the password immediately after first login.');
}

main().finally(() => prisma.$disconnect());
