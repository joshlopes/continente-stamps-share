import { defineConfig } from "prisma/config";

export default defineConfig({
  // Schema location
  schema: "prisma/schema.prisma",

  // Migration configuration
  migrations: {
    path: "prisma/migrations",
    seed: "bun run prisma/seed.ts",
  },

  // Database connection URL
  // Use process.env with a placeholder fallback for prisma generate in CI
  // (generate doesn't need a real database connection)
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});

