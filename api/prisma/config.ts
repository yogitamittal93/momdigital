
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // This looks for DATABASE_URL in your .env file
    url: process.env.DATABASE_URL,
  },
});