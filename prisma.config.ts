import path from 'node:path';
import { defineConfig, env } from 'prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'ts-node --transpile-only prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
