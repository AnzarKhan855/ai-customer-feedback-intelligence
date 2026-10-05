# Project LOOP 2.0 — Enterprise AI Customer Feedback Intelligence Platform

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-indigo?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20Serverless-336791?logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-sky?logo=tailwindcss)](https://tailwindcss.com/)
[![Anthropic Claude](https://img.shields.io/badge/Claude-3.5%20Sonnet-purple?logo=anthropic)](https://docs.claude.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-79%2F79%20Passing-emerald)](https://nodejs.org/)
[![Production Ready](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-success)](https://ai-customer-feedback-intelligence-black.vercel.app)

> **"Turn scattered customer feedback into defensible, mathematically grounded product strategy."**  
> LOOP 2.0 is an enterprise-grade Voice of Customer (VoC) Intelligence platform that ingests multi-channel customer signals (Zendesk, Intercom, Gong, Discord, App Stores, and CSVs), runs them through a multi-stage NLP intelligence pipeline (Sentiment + Confidence, Plutchik-8 Emotion Taxonomy, Aspect-Based Sentiment Analysis [ABSA], 9-class Intent Detection, Explainable 0–100 Severity Scoring, Churn Risk Detection, and Grounded Root Cause Analysis), and delivers executive insights backed by verified, workspace-scoped customer evidence.

**Production Deployment:** [https://ai-customer-feedback-intelligence-black.vercel.app](https://ai-customer-feedback-intelligence-black.vercel.app)

---

## 🎯 Quick Demo Access (Pre-Seeded Acme Corp Workspace)

The platform comes pre-seeded with a production-grade multi-channel corpus (**127+ realistic customer feedback records**, active anomaly alerts, leadership AI recommendations, and product roadmap items).

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@loop.dev` | `password123` | Full workspace governance: Manage members & RBAC, dataset ingestion & purge, system health diagnostics, triage, roadmap, VoC reports |
| **Analyst** | `analyst@loop.dev` | `password123` | Feedback ingestion (Single / CSV / Stream), triage status, trigger AI re-classification, push engineering tickets, PM decision hub |
| **Viewer** | `viewer@loop.dev` | `password123` | Read-only executive access: Dashboard, trends, and query Ask LOOP AI Analyst |

---

## 🚀 15 High-Value Enterprise Intelligence Features

LOOP 2.0 features 15 modular, mathematically grounded enterprise capabilities engineered to eliminate metric hallucination and deliver actionable product intelligence:

```
┌───────────────────────────────────────┬──────────────────────────────────┬─────────────────────────────────────────────────────────┐
│ Feature Domain                        │ API Endpoint                     │ Core Enterprise Value                                   │
├───────────────────────────────────────┼──────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 1. Customer Health Intelligence       │ GET /api/health-score            │ Weighted 0–100 account health composite index           │
│ 2. Grounded Root Cause Explorer       │ GET /api/insights/root-cause     │ Hypothesis generation grounded strictly in feedback     │
│ 3. Emerging Issue Trend Detection     │ GET /api/analytics/trends/emerging│ Velocity & burst detection (Poisson/Z-score surges)     │
│ 4. Product Gap & Competitor Mining    │ GET /api/product/gaps            │ Feature deficit extraction with ARR churn exposure      │
│ 5. AI Strategic Priority Matrix       │ GET /api/strategy/priority-matrix│ 2x2 Impact vs Urgency quadrant ranking                  │
│ 6. Semantic Feedback Clusters         │ GET /api/feedback/clusters       │ Jaccard-similarity semantic feedback grouping           │
│ 7. Executive Intelligence Briefing    │ GET /api/insights/executive-briefing│ Synthesis of Net Sentiment, P0 items & risks         │
│ 8. Intelligent Deduplication          │ GET /api/feedback/duplicates     │ Levenshtein & token-overlap duplicate cluster review    │
│ 9. Action Recommendation Engine       │ POST /api/recommendations/promote│ 1-click promotion of insights into roadmap action items │
│ 10. AI Executive Report Builder       │ POST /api/reports/custom         │ Custom PDF/Markdown exportable intelligence briefings   │
│ 11. Enterprise Activity Center        │ GET /api/notifications           │ Unified notification stream with read state tracking    │
│ 12. Enterprise Command Palette (Cmd+K)│ Client-side Hotkey Modal         │ Instant keyboard-driven navigation & global search      │
│ 13. PM Intelligence Workspace         │ GET /pm                          │ Dedicated Product Manager triage & decision hub         │
│ 14. Ingestion Operations Command      │ GET /api/datasets/diagnostics    │ Channel health, data quality, & ingestion telemetry     │
│ 15. Enterprise Control Center         │ GET /api/admin/diagnostics       │ DB latency, storage quotas, RBAC audit, & maintenance   │
└───────────────────────────────────────┴──────────────────────────────────┴─────────────────────────────────────────────────────────┘
```

### Feature Deep-Dive

#### 1. Customer Health Intelligence (`lib/customer-health.ts`)
Computes account health composites (0–100) based on positive sentiment ratio (40%), inverse critical severity count (30%), inverse churn flag count (20%), and feedback volume vitality (10%). Classifies accounts into **Champions (80–100)**, **Stable (60–79)**, **At Risk (40–59)**, and **Critical Churn Danger (0–39)**.

#### 2. Grounded Root Cause Explorer (`lib/root-cause.ts`)
Analyzes negative and distressed feedback within a topic, extracts high-frequency system/process error entities, generates causal hypotheses, and verifies that every hypothesis has at least 1 verified citation link to database records.

#### 3. Emerging Issue Trend Detection (`lib/trends-detector.ts`)
Compares recent 7-day feedback volumes against previous periods to identify statistical surges, sudden sentiment degradation, and velocity anomalies. Categorizes trends into `SPIKE`, `ACCELERATING`, and `WATCH`.

#### 4. Product Gap & Competitive Mining (`lib/product-gaps.ts`)
Extracts missing capabilities, integration requests, and competitor displacements. Calculates ARR at risk per gap category and provides direct quotes from enterprise customers.

#### 5. AI Strategic Priority Matrix (`lib/priority-matrix.ts`)
Evaluates product issues across **Impact** (severity + ARR affected) and **Urgency** (sentiment velocity + volume surge). Categorizes initiatives into:
- **Quick Wins:** High impact, low effort
- **Major Projects:** High impact, high effort
- **Fill-ins:** Low impact, low effort
- **Deprioritize:** Low impact, high effort

#### 6. Semantic Feedback Clusters (`lib/clusters.ts`)
Groups unstructured feedback items using token Jaccard similarity and shared aspect tags, computing centroid sentiment, aggregate severity, and dominant emotion for each cluster.

#### 7. Executive Intelligence Briefing (`lib/briefing.ts`)
Produces concise leadership briefings summarizing weekly VoC trajectory, critical P0 incidents, top customer pain points, and recommended leadership actions.

#### 8. Feedback Deduplication & Merging (`lib/deduplication.ts`)
Scans feedback records for near-identical submissions (Levenshtein distance & normalized text hash), allowing triage teams to group duplicate tickets and maintain data hygiene.

#### 9. Intelligent Action Recommendation Engine (`lib/action-recommendations.ts`)
Bridges the gap between AI analysis and engineering execution. Converts high-severity feedback trends into formal action items and pushes them directly into the Product Roadmap.

#### 10. AI Executive Report Builder (`lib/report-builder.ts`)
Generates comprehensive executive reports with configurable sections (Executive Summary, Sentiment Breakdown, ABSA Highlights, Roadmap Progress) exportable as structured JSON or Markdown.

#### 11. Enterprise Activity Center (`lib/activity.ts`)
Provides real-time activity and alert feeds with unread badge indicators, category filters, and quick action links directly from the navigation bar.

#### 12. Enterprise Command Palette & Global Search (`components/search/CommandPalette.tsx`)
Accessible via `Cmd+K` / `Ctrl+K`. Enables instant fuzzy navigation across all 15 platform modules, feedback items, customer accounts, and administrative settings.

#### 13. Product Manager Decision Hub (`app/(app)/pm/page.tsx`)
A dedicated command center for product managers unifying the Strategic Priority Matrix, Emerging Issues Radar, Product Gaps, and Root Cause Explorer into a single high-efficiency view.

#### 14. Ingestion Operations Command Center (`lib/data-ops.ts`)
Monitors ingestion pipeline health, channel-by-channel throughput, data hygiene scores, and schema validation errors across all incoming feedback streams.

#### 15. Enterprise Control Center & Diagnostics (`lib/admin-control.ts`)
Provides workspace administrators with deep observability into database connection latency, tenant quota utilization, RBAC role distribution, and system uptime.

---

## 🧠 System Architecture & Data Flow

```mermaid
graph TD
    subgraph INGESTION["1. Multi-Channel Ingestion Gate"]
        API["REST Ingestion API (/api/feedback)"]
        CSV["CSV Ingestion Engine (/api/feedback/bulk)"]
        SIM["Multi-Channel Simulator (Zendesk, Intercom, App Store)"]
    end

    subgraph QUALITY["2. Data Quality & Hygiene Engine"]
        NORM["Text Normalization & Injection Stripping"]
        DETECT["Schema & Column Inference"]
        DEDUP["Content Hashing & Deduplication (/api/feedback/duplicates)"]
        SCORE["0–100 Data Quality Scoring (Completeness, Validity, Uniqueness)"]
        OPS["Ingestion Operations Diagnostics (/api/datasets/diagnostics)"]
    end

    subgraph NLP["3. Dual-Engine NLP Intelligence Pipeline"]
        CLAUDE["Anthropic Claude 3.5 Sonnet (When API Key is Configured)"]
        FALLBACK["Deterministic Local NLP Engine (Graceful Degradation When LLM Is Offline)"]
        SENT["Sentiment Score (-1.0 to +1.0) & Confidence"]
        EMOT["Plutchik-8 Emotion Taxonomy (Frustration, Delight, Confusion, etc.)"]
        ABSA["Aspect-Based Sentiment Analysis (ABSA)"]
        INTENT["9-Class Intent Classification (Bug, Feature, Refund, etc.)"]
        SEV["Explainable 0–100 Severity Formula (P0–P3)"]
        CHURN["Predictive Churn Risk Detection"]
        RCA["Root Cause Analysis (RCA) Hypotheses (/api/insights/root-cause)"]
        CLUST["Semantic Clustering (/api/feedback/clusters)"]
    end

    subgraph STORAGE["4. Multi-Tenant Relational Persistence"]
        DB[("Prisma ORM (PostgreSQL on Neon / SQLite locally)")]
        TENANT["Strict Workspace Tenant Isolation (workspaceId Scoping)"]
        DIAG["Admin Diagnostics & Connection Health (/api/admin/diagnostics)"]
    end

    subgraph APPS["5. Product Surfaces & Decision Intelligence"]
        DASH["Executive Dashboard & Live Metric Ticker"]
        PM["PM Decision Hub & Priority Matrix (/pm)"]
        HEALTH["Customer Health Intelligence (/api/health-score)"]
        TRENDS["Emerging Trends Radar (/api/analytics/trends/emerging)"]
        GAPS["Product Gaps & ARR Risk Explorer (/api/product/gaps)"]
        ASK["Ask LOOP AI Analyst (Grounded RAG with traceable citations)"]
        REPORTS["AI Executive Report Builder (/api/reports/custom)"]
        NOTIF["Enterprise Activity Center (/api/notifications)"]
        PALETTE["Cmd+K Command Palette & Global Search"]
    end

    INGESTION --> QUALITY
    QUALITY --> NLP
    NLP --> STORAGE
    STORAGE --> APPS
```

---

## 🔬 Multi-Layer NLP Taxonomy & Methodology

### 1. Plutchik-8 Emotion Taxonomy
Rather than reducing customer expression to binary "good/bad", LOOP classifies every feedback item across 8 emotional dimensions with confidence scoring:
- **Frustration:** Latency, broken flows, repeated blockers.
- **Delight:** Flawless workflows, unexpectedly fast responses.
- **Confusion:** Onboarding ambiguities, unclear documentation.
- **Anger:** Financial errors, sudden pricing changes, unhelpful support.
- **Satisfaction:** Reliable execution, intuitive features.
- **Disappointment:** Missing enterprise capabilities, regressions.
- **Excitement:** Feature announcements, major upgrades.
- **Concern:** Security questions, privacy policies, data residency.

### 2. Aspect-Based Sentiment Analysis (ABSA)
A single customer comment often contains opposing sentiments across different modules. LOOP decomposes comments into granular aspect tuples:
- `Aspect`: e.g., `Authentication / SSO`, `Billing & Invoicing`, `Performance & Speed`, `Mobile Experience`, `Customer Support`.
- `Sentiment`: `POS` | `NEU` | `NEG` with aspect-specific polarity score (-1.0 to +1.0).
- `Rationale`: Sentence-level attribution explaining why the aspect received its score.

### 3. Explainable 0–100 Severity Formula
Severity is computed deterministically with transparent rationales:
$$\text{Severity} = \text{Base}(25) + \text{Negative Sentiment}(+25) + \text{Distress/Anger}(+15) + \text{System Failure}(+20) + \text{Security/Lockout}(+35) + \text{Financial/Refund}(+35) + \text{Enterprise ARR}(+10)$$
- **P0 Critical (75–100):** System outages, security breaches, multi-user lockouts, enterprise revenue risk.
- **P1 High (55–74):** Core feature regressions, billing invoice errors, active churn threats.
- **P2 Medium (35–54):** Minor usability friction, configuration queries, non-blocking bugs.
- **P3 Low (0–34):** Aesthetic suggestions, positive commendations, minor polish.

### 4. Grounded AI Analyst (RAG with Traceable Citations)
The **Ask LOOP** interface queries the workspace semantic vector index and prompts the AI model with strict grounding rules:
- **Traceable Grounding:** Every factual claim must cite the specific feedback record ID, channel, and observed customer evidence.
- **Empirical Synthesis:** Pre-computed metrics (total volume, negative percentage, top aspects) are passed directly into the prompt context to prevent statistical discrepancies.
- **Honest Zero-Match Detection:** When an inquiry targets topics not present in the workspace dataset, the system explicitly reports that no relevant feedback was found rather than fabricating or backfilling unrelated items.

### 5. Graceful Local Fallback
When the external LLM provider is unavailable or not configured, the platform falls back to its deterministic local NLP engine for core classification and analysis.

---

## 🛡️ Enterprise Data Quality & Security

- **0–100 Data Quality Gate:** Calculates data completeness, format validity, and duplicate rates before ingestion. Bad rows and duplicates are safely quarantined with row-by-row error logs.
- **Strict Multi-Tenant Isolation:** All database queries, vector searches, and dataset operations enforce `where: { workspaceId: session.user.workspaceId }`. Cross-tenant data leakage is prevented by design.
- **Role-Based Access Control (RBAC):** Admin, Analyst, and Viewer permissions enforced via NextAuth session tokens and API route guards.
- **Epistemic Labeling in UI:** The Feedback Inspection Drawer explicitly distinguishes:
  - `[FACT]`: Customer text, source channel, timestamp, user tier.
  - `[MODEL PREDICTION]`: Sentiment score, emotion taxonomy, intent class.
  - `[AI INFERENCE]`: Severity index rationale, churn risk likelihood, root cause hypothesis.

---

## ⚡ Quickstart & Local Execution

### 1. Prerequisites
- **Node.js 18 LTS** or newer (Standardized on Node v20 LTS; tested on v18, v20, v22, v26)
- **npm** >= 9
- **Git**

### 2. Installation
```bash
git clone https://github.com/AnzarKhan855/ai-customer-feedback-intelligence.git
cd ai-customer-feedback-intelligence
npm install
```

### 3. Environment Configuration
Create a `.env` file from `.env.example`:
```env
# Zero-friction local SQLite database
DATABASE_URL="file:./dev.db"

# NextAuth configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-to-a-secure-random-32-char-string-in-production"

# Optional: Anthropic Claude API Key (When omitted, the platform uses local deterministic NLP fallback)
ANTHROPIC_API_KEY=""
```

### 4. Database Setup & Seeding
```bash
# Push schema to SQLite
npx prisma db push

# Seed 127+ realistic feedback items, 3 users, alerts, recommendations, and themes
npm run db:seed
```

### 5. Run the Automated Test Suite
```bash
npm test
```
*Executes all 79 automated tests across 36 test suites covering the NLP pipeline, data quality scoring, database model invariants, security multi-tenancy, RAG retrieval, and all 15 enterprise intelligence engines.*

### 6. Launch the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application, or go straight to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to explore the executive console.

---

## 🧪 Automated Test Suite (All 79 Tests Passing)

```bash
$ npm test
ℹ tests 79
ℹ suites 36
ℹ pass 79
ℹ fail 0
```

| Test Suite Category | Test Files | Tests | Coverage |
| :--- | :--- | :--- | :--- |
| **Enterprise Expansion (15 Features)** | `tests/customer-health.test.ts`<br>`tests/root-cause.test.ts`<br>`tests/trends-detector.test.ts`<br>`tests/product-gaps.test.ts`<br>`tests/priority-matrix.test.ts`<br>`tests/clusters.test.ts`<br>`tests/briefing.test.ts`<br>`tests/deduplication.test.ts`<br>`tests/action-recommendations.test.ts`<br>`tests/report-builder.test.ts`<br>`tests/activity-center.test.ts`<br>`tests/command-palette.test.ts`<br>`tests/pm-workspace.test.ts`<br>`tests/data-ops.test.ts`<br>`tests/admin-control.test.ts` | 49 passed | Health scoring, root cause grounding, surge detection, product gaps, 2x2 matrix, clustering, briefings, deduplication, recommendation promotion, custom reports, notifications, search, PM hub, data ops, admin diagnostics & RBAC |
| **AI & NLP Pipeline** | `tests/ai-pipeline.test.ts` | 10 passed | Emotion taxonomy, ABSA aspect extraction, intent detection, severity formula, churn risk, and schema validation |
| **Data Quality Engine** | `tests/data-quality.test.ts` | 7 passed | Text normalization, header inference, deduplication, and 0–100 quality scoring |
| **Database Model Invariants** | `tests/database.test.ts` | 5 passed | Workspace isolation, enriched NLP attributes, alert state machine, and recommendation relations |
| **RAG Retrieval Quality** | `tests/rag-retrieval.test.ts` | 4 passed | Workspace isolation, topic relevance ranking, deduplication, and zero-match truthful reporting |
| **Security & Multi-Tenancy** | `tests/security-multitenancy.test.ts` | 4 passed | Cross-workspace isolation, input sanitization, and salted bcrypt credential hashing |

---

## 📦 Production Deployment (Vercel + PostgreSQL)

For cloud production environments:
1. Provide a managed PostgreSQL database (Neon, Supabase, AWS RDS, Railway).
2. Configure environment variables in your hosting provider:
   - `DATABASE_URL` = `postgresql://user:password@host-pooler:5432/database?sslmode=require` (Pooled connection)
   - `DIRECT_URL` = `postgresql://user:password@host-direct:5432/database?sslmode=require` (Direct unpooled connection for Prisma Migrate)
   - `NEXTAUTH_SECRET` = `<cryptographically-random-32-char-string>`
   - `NEXTAUTH_URL` = `https://ai-customer-feedback-intelligence-black.vercel.app` (or custom domain)
   - `ANTHROPIC_API_KEY` = `sk-ant-...` (optional; falls back to high-precision deterministic NLP if omitted)
3. Deploy schema migrations to managed PostgreSQL:
   ```bash
   npm run db:deploy:prod
   ```
4. Verify deployment integrity with the live test suite:
   ```bash
   npm run test:live
   ```

---

## 👥 Credits & Attribution

Originally created collaboratively by **Ayush Verma** and **Anzar Khan**, and engineered into **LOOP 2.0 AI Customer Feedback Intelligence Platform** featuring ABSA, Plutchik-8 emotion analysis, explainable severity indices, grounded RAG intelligence, 15 modular enterprise intelligence capabilities, and multi-tenant VoC governance.
