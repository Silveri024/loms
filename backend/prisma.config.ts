import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    db: {
      provider: 'mysql',
      url: process.env.DATABASE_URL,
    },
  },
});
