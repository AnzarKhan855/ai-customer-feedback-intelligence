# Production Deployment Guide — LOOP 2.0

## 1. Hosting Architecture

- **Web & API Tier:** Vercel Serverless Edge Network (Next.js 14 App Router)
- **Database Tier:** Neon Serverless PostgreSQL with connection pooling
- **DNS / Domain:** `https://ai-customer-feedback-intelligence-black.vercel.app`

---

## 2. Environment Variables Specification

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Pooled PostgreSQL connection string for Prisma query engine | `postgresql://user:pass@ep-xyz-pooler.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Direct unpooled connection string for Prisma migrations | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `NEXTAUTH_SECRET` | 32+ character cryptographically random key for JWT encryption | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical public URL of the application | `https://ai-customer-feedback-intelligence-black.vercel.app` |
| `ANTHROPIC_API_KEY` | Optional Anthropic API key for Claude 3.5 Sonnet narratives | `sk-ant-api03-...` |

---

## 3. Database Migration Protocol

All database schema evolutions must be applied using non-destructive Prisma migrations:

```bash
# Apply pending migrations to production
npm run db:deploy:prod

# Check migration status
npx prisma migrate status --schema=prisma/schema.postgresql.prisma
```

**Absolute Safety Rules:**
- NEVER run `prisma migrate reset` in production.
- NEVER run `prisma db push` on production databases.
- NEVER run destructive `DROP TABLE` or `DROP SCHEMA` commands.

---

## 4. Build & Post-Install Lifecycle

The `package.json` includes automated environment-aware client generation:
- `npm run postinstall` executes `scripts/prisma-generate.js`, automatically generating the PostgreSQL client when deployed on Vercel (`VERCEL=1`) or PostgreSQL is configured, and SQLite client during isolated local testing.
- `npm run build` runs `prisma-generate.js` followed by `next build`.

---

## 5. Live Production Verification

Run the automated live smoke test suite:
```bash
npm run test:live
```
Validates authentication, API health, feedback ingestion, triage, RAG Q&A, and VoC report generation directly against the live Vercel deployment.
