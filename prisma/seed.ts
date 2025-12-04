import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  const store = await prisma.store.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Smart Wallets Shop',
      slug: 'default',
      defaultCurrency: 'AUD',
      timezone: 'Australia/Melbourne',
    },
  });

  await prisma.shippingProfile.create({
    data: {
      storeId: store.id,
      name: 'Default Shipping',
    },
  });

  const adminHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'info.bytecrafters@gmail.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'info.bytecrafters@gmail.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const cat = await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: 't-shirts' } },
    update: {},
    create: { storeId: store.id, name: 'T-Shirts', slug: 't-shirts' },
  });

  const p = await prisma.product.upsert({
    where: { storeId_slug: { storeId: store.id, slug: 'unisex-tee' } },
    update: {},
    create: {
      storeId: store.id,
      title: 'Unisex Tee',
      slug: 'unisex-tee',
      description: 'Soft cotton tee',
      categoryId: cat.id,
    },
  });

  const size = await prisma.productOption.upsert({
    where: { productId_name: { productId: p.id, name: 'Size' } },
    update: {},
    create: { productId: p.id, name: 'Size', position: 0 },
  });
  const color = await prisma.productOption.upsert({
    where: { productId_name: { productId: p.id, name: 'Color' } },
    update: {},
    create: { productId: p.id, name: 'Color', position: 1 },
  });

  const [S, M, L] = await Promise.all(
    ['S', 'M', 'L'].map((v, i) =>
      prisma.productOptionValue.upsert({
        where: { optionId_value: { optionId: size.id, value: v } },
        update: {},
        create: { optionId: size.id, value: v, position: i },
      }),
    ),
  );
  const [Black, White] = await Promise.all(
    ['Black', 'White'].map((v, i) =>
      prisma.productOptionValue.upsert({
        where: { optionId_value: { optionId: color.id, value: v } },
        update: {},
        create: { optionId: color.id, value: v, position: i },
      }),
    ),
  );

  async function mk(
    sv: string,
    cv: string,
    sku: string,
    price: number,
    qty = 10,
  ) {
    const sVal = await prisma.productOptionValue.findFirst({
      where: { optionId: size.id, value: sv },
    });
    const cVal = await prisma.productOptionValue.findFirst({
      where: { optionId: color.id, value: cv },
    });
    const v = await prisma.productVariant.upsert({
      where: { sku },
      update: {},
      create: { productId: p.id, sku },
    });
    await prisma.productVariantOptionValue.upsert({
      where: { variantId_optionValueId: { variantId: v.id, optionValueId: sVal!.id } },
      update: {},
      create: { variantId: v.id, optionValueId: sVal!.id },
    });
    await prisma.productVariantOptionValue.upsert({
      where: { variantId_optionValueId: { variantId: v.id, optionValueId: cVal!.id } },
      update: {},
      create: { variantId: v.id, optionValueId: cVal!.id },
    });
    const existingPrice = await prisma.productVariantPrice.findFirst({
      where: { variantId: v.id, currency: 'AUD' },
    });
    if (!existingPrice) {
      await prisma.productVariantPrice.create({
        data: { variantId: v.id, currency: 'AUD', amount: price },
      });
    }
    await prisma.variantInventory.upsert({
      where: { variantId: v.id },
      update: {},
      create: { variantId: v.id, quantity: qty },
    });
  }
  await mk('S', 'Black', 'TEE-S-BLK', 2999);
  await mk('M', 'Black', 'TEE-M-BLK', 2999);
  await mk('L', 'White', 'TEE-L-WHT', 2999);

  console.log('Seed done');
}
main().finally(() => prisma.$disconnect());
