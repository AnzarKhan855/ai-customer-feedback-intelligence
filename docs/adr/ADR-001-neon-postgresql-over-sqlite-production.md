# ADR 001: Selection of Neon Serverless PostgreSQL for Production

## Status
Accepted

## Context
The application requires a robust, scalable relational database for production SaaS deployment on Vercel. Early prototypes used SQLite, which suffers from ephemeral filesystem wipes in serverless lambdas and lacks concurrent connection pooling.

## Decision
Adopt Neon Serverless PostgreSQL with dual connection URLs (`DATABASE_URL` with PgBouncer connection pooling and `DIRECT_URL` for migration DDL).

## Consequences
- **Positive:** Persistent serverless storage, auto-scaling, transaction safety, high concurrency, zero file lock contention.
- **Negative:** Requires handling cold starts gracefully during initial query execution.
