#!/usr/bin/env node
const { execSync } = require("child_process");

const dbUrl = process.env.DATABASE_URL || "";
const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");
const isVercel = Boolean(process.env.VERCEL);
const explicitSchema = process.env.PRISMA_SCHEMA;

let schema = "prisma/schema.prisma";

if (explicitSchema) {
  schema = explicitSchema;
} else if (isPostgres || isVercel) {
  schema = "prisma/schema.postgresql.prisma";
}

console.log(`[prisma-generate] Target schema: ${schema} (isPostgres=${isPostgres}, isVercel=${isVercel})`);

try {
  execSync(`npx prisma generate --schema=${schema}`, { stdio: "inherit" });
} catch (error) {
  console.error(`[prisma-generate] Failed to generate Prisma client with ${schema}:`, error);
  process.exit(1);
}
