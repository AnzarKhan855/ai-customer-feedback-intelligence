#!/usr/bin/env node
const { execSync } = require("child_process");

const fs = require("fs");

let dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl && fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf8");
  const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)/m);
  if (match) dbUrl = match[1].trim();
}

const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

const isVercel = Boolean(process.env.VERCEL);
const explicitSchema = process.env.PRISMA_SCHEMA;

let schema = "prisma/schema.prisma";

if (explicitSchema) {
  schema = explicitSchema;
} else if (isPostgres || isVercel) {
  schema = "prisma/schema.postgresql.prisma";
}

// Clean stale .next cache on local environments to prevent Windows/OneDrive readlink EINVAL issues
if (!isVercel && fs.existsSync(".next")) {
  try {
    fs.rmSync(".next", { recursive: true, force: true });
  } catch (_) {}
}

console.log(`[prisma-generate] Target schema: ${schema} (isPostgres=${isPostgres}, isVercel=${isVercel})`);

try {
  execSync(`npx prisma generate --schema=${schema}`, { stdio: "inherit" });
} catch (error) {
  console.error(`[prisma-generate] Failed to generate Prisma client with ${schema}:`, error);
  process.exit(1);
}
