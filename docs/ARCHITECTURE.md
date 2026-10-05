# Architecture Specification — LOOP 2.0

## 1. System Overview

LOOP 2.0 is an enterprise-grade AI Customer Feedback Intelligence Platform designed to ingest multi-channel customer communications, classify them through a multi-stage NLP pipeline, and deliver grounded executive insights with zero hallucination.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  Next.js 14 App Router  *  React 18  *  Tailwind CSS  *  Recharts  *  Lucide UI   |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                                APPLICATION TIER                                   |
|  Next.js Server Handlers  *  NextAuth (JWT)  *  RBAC Middleware  *  Rate Limiter  |
|                                                                                   |
|  +--------------------+  +--------------------+  +------------------------------+ |
|  |  NLP Intelligence  |  |  RAG 2.0 Engine    |  |  Enterprise Audit Logger    | |
|  |  Pipeline          |  |  Semantic Search   |  |  (Redaction & Workspace Iso) | |
|  +--------------------+  +--------------------+  +------------------------------+ |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                                  DATA TIER                                        |
|  Prisma ORM 5.22  *  Neon Serverless PostgreSQL (Pooled & Direct Connection)      |
|  SQLite (Local Ephemeral Test Harness & Fixture Execution)                        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Pillars

### 2.1 Multi-Tenant Data Isolation
Every persistent database model includes a mandatory `workspaceId` foreign key referencing the tenant's `Workspace` entity:
- Direct index coverage on `(workspaceId)` across `Feedback`, `Theme`, `Alert`, `AIRecommendation`, `ActionItem`, `RoadmapItem`, `Report`, and `AuditLog`.
- Every Prisma query in server route handlers enforces `{ where: { workspaceId } }`.
- Cross-tenant leakage is architecturally prohibited and verified by automated regression tests.

### 2.2 Dual-Schema Parity Architecture
To guarantee hermetic local testing without requiring external network access while deploying seamlessly to cloud infrastructure:
1. `prisma/schema.postgresql.prisma`: PostgreSQL provider targeting Neon Serverless for production deployments with pooling.
2. `prisma/schema.prisma`: SQLite provider targeting `dev.db` for isolated local unit tests (`npm test`).
3. Model schemas and field definitions maintain 100% parity across both files.

### 2.3 Grounded RAG 2.0 Semantic Search
Unlike naive vector wrappers, LOOP 2.0 implements hybrid dense-lexical ranking:
- 64-dimensional semantic embedding vectors generated via dense n-gram hashing and stopword normalization.
- Combined scoring: `finalScore = 0.35 * semanticScore + 0.65 * lexicalOverlap`.
- Exact citation verification: Every generated narrative cites verified database IDs `[ID: cm...]` so executives can inspect verbatim evidence.

---

## 3. Directory Layout

```
.
├── app/
│   ├── (app)/              # Authenticated product routes (Dashboard, Inbox, Ask, Reports, Alerts)
│   ├── (auth)/             # Public authentication routes (Login, Signup)
│   └── api/                # REST API endpoints (Auth, Feedback, Dashboard, Insights, Audit, Health)
├── components/
│   ├── dashboard/          # Metric cards, charts, VoC radar, live signal ticker
│   ├── feedback/           # Feedback table, inspection drawer, modals
│   └── layout/             # Responsive AppShell, Sidebar, Navbar
├── docs/                   # Architecture, Security, API, AI-RAG guides & ADRs
├── lib/
│   ├── ai.ts               # Multi-layer classification, ABSA, Plutchik-8, VoC narratives
│   ├── audit.ts            # Enterprise tenant-isolated audit logging
│   ├── auth.ts             # NextAuth credentials provider and RBAC enforcement
│   ├── db.ts               # Prisma client singleton
│   ├── rate-limit.ts       # Sliding window rate limiter
│   ├── search.ts           # Hybrid lexical/semantic vector search
│   └── types.ts            # Zod validation schemas and TypeScript type models
├── prisma/
│   ├── schema.postgresql.prisma  # Production PostgreSQL schema
│   ├── schema.prisma             # Local test SQLite schema
│   └── migrations/               # Non-destructive version-controlled migrations
└── tests/                  # Automated regression test suites
```
