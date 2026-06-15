import path from 'node:path';
import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';

dotenv.config(); // no-op in Docker; loads .env for local dev

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'ts-node --transpile-only prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
