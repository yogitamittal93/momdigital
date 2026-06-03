import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // This replaces the 'url' from your schema
    url: process.env.DIRECT_URL,
  },
  migrations: {
    // This replaces 'directUrl' for migration tasks
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    path: './prisma/migrations',
  },
});