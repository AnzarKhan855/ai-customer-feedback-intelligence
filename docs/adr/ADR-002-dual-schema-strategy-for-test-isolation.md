# ADR 002: Dual-Schema Strategy for Local Test Isolation

## Status
Accepted

## Context
Running automated test suites against cloud databases introduces flakiness, network latency, external credential dependency in CI, and risk of data pollution.

## Decision
Maintain two synchronized Prisma schema files:
1. `prisma/schema.postgresql.prisma`: PostgreSQL provider targeting Neon for production.
2. `prisma/schema.prisma`: SQLite provider targeting an isolated `dev.db` for fast, hermetic test execution.

A specialized build script (`scripts/prisma-generate.js`) dynamically selects the target schema depending on the active environment (`VERCEL=1`, `npm test`, or local development).

## Consequences
- **Positive:** Fast offline unit testing (`<1s`), zero CI dependency on live credentials, hermetic fixtures.
- **Negative:** Schema edits must be synchronized across both schema files.
