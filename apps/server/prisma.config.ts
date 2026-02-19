import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Schema location
  schema: "prisma/schema.prisma",

  // Migration configuration
  migrations: {
    path: "prisma/migrations",
    seed: "bun run prisma/seed.ts",
  },

  // Database connection URL
  datasource: {
    url: env("DATABASE_URL"),
  },
});

