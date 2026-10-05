# REST API Reference — LOOP 2.0

All endpoints require authentication unless specified as public. Authenticated requests use session cookies managed by NextAuth.

---

## 1. Authentication & System

### `POST /api/auth/signup`
- **Access:** Public (Rate Limited: 10 req/min/IP)
- **Body:** `{ name, email, password, workspaceName }`
- **Response:** `201 Created` `{ user, workspace }`
- **Audit:** Records `AUTH_SIGNUP`

### `GET /api/health`
- **Access:** Public
- **Response:** `200 OK`
  ```json
  {
    "status": "ready",
    "timestamp": "2026-10-05T12:00:00.000Z",
    "responseTimeMs": 15,
    "database": { "status": "healthy", "latencyMs": 12, "workspaces": 1, "feedbackRecords": 130 },
    "aiEngine": { "provider": "Anthropic Claude 3.5 Sonnet", "status": "active" },
    "system": { "uptimeSeconds": 3600, "nodeVersion": "v20.x", "memoryUsageMb": { "rss": 85, "heapUsed": 45, "heapTotal": 65 } },
    "version": "2.0.0"
  }
  ```

---

## 2. Customer Feedback Intelligence

### `GET /api/feedback`
- **Query Params:** `page`, `limit`, `search`, `channel`, `sentiment`, `emotion`, `intent`, `priority`, `status`, `theme`, `churnOnly`, `sortBy`
- **Response:** `{ items: [...], pagination: { page, limit, totalCount, totalPages } }`

### `POST /api/feedback`
- **Role Required:** `ADMIN`, `ANALYST`
- **Body:** `{ content, channel, customerLabel?, product?, region?, sourceRef? }`
- **Audit:** Records `FEEDBACK_CREATE`

### `PATCH /api/feedback`
- **Role Required:** `ADMIN`, `ANALYST`
- **Body:** `{ id?: string, ids?: string[], status: "NEW" | "REVIEWED" | "ACTIONED" }`
- **Audit:** Records `FEEDBACK_UPDATE` with target IDs

### `GET /api/feedback/export`
- **Query Params:** `search`, `sentiment`, `channel`, `status`, `format` (`csv` | `json`)
- **Audit:** Records `EXPORT_DATA`

---

## 3. Analytics & Grounded AI

### `GET /api/dashboard/stats`
- **Query Params:** `days` (7, 30, 90)
- **Response:**
  - `metrics`: Totals, deltas (`feedbackGrowthPct`, `sentimentDeltaPct`), Net Sentiment Score
  - `vocBreakdown`: Top problems, feature desires, active churn signals
  - `volumeOverTime`, `channelDistribution`, `topThemes`, `emotionDistribution`, `severityDistribution`

### `POST /api/insights/ask`
- **Rate Limit:** 30 queries/min/workspace
- **Body:** `{ question, limit?, filterSentiment?, filterTheme?, filterChannel?, minSeverity? }`
- **Response:**
  - `answer`: Grounded executive narrative with inline citations
  - `citedFeedback`: Exact database records cited
  - `metricsSummary`: Pre-calculated empirical statistics

---

## 4. Workflows & Governance

### `GET /api/search`
- **Query Params:** `q`, `limit?`
- **Response:** Multi-entity results grouped by `feedback`, `themes`, `recommendations`, `actionItems`

### `GET /api/audit-logs`
- **Role Required:** `ADMIN`, `ANALYST`
- **Query Params:** `page`, `limit`, `action`, `entity`
- **Response:** Workspace-scoped audit log entries with sanitized metadata
