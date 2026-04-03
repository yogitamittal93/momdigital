// api/prisma.config.js
const { defineConfig } = require('@prisma/config');

module.exports = defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // This correctly pulls the URL from your .env
    url: process.env.DATABASE_URL,
  },
});