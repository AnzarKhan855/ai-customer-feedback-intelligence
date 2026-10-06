#!/usr/bin/env node
const { execSync } = require("child_process");

console.log("🧪 Running automated test suite against isolated SQLite fixtures...");
execSync("npx prisma generate --schema=prisma/schema.prisma", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: "file:./dev.db" },
});

// Ensure SQLite test schema exists and seed fixtures are populated
execSync("npx prisma db push --schema=prisma/schema.prisma --skip-generate", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: "file:./dev.db" },
});
execSync("npx tsx prisma/seed.ts", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: "file:./dev.db" },
});

let testError = null;
try {
  execSync("npx tsx --test tests/*.test.ts", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./dev.db" },
  });
} catch (err) {
  testError = err;
} finally {
  console.log("🔄 Restoring Prisma client for active environment...");
  execSync("node scripts/prisma-generate.js", { stdio: "inherit" });
}

if (testError) {
  process.exit(1);
}
