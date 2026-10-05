# Security & Compliance Architecture — LOOP 2.0

## 1. Multi-Tenant Boundary Enforcement (Zero Trust)

LOOP 2.0 treats multi-tenant isolation as a foundational security invariant:
- **Tenant Scope:** Every user belongs to exactly one `Workspace`.
- **Query Hardening:** Database queries in all operational routes enforce `where: { workspaceId }`.
- **In-Memory IDOR Resistance:** Direct Object References (`id`) cannot bypass workspace filtering. If an authenticated user queries an `id` that belongs to another tenant, the query returns `404 Not Found` or empty results.
- **Automated Verification:** Verified in `tests/security-multitenancy.test.ts` and `tests/enterprise-regression.test.ts`.

---

## 2. Authentication & Credential Hardening

- **Password Storage:** All passwords are protected using `bcryptjs` with salt rounds = 10 (`$2b$10$...`). Plaintext passwords are never persisted.
- **Session Tokens:** NextAuth implements JSON Web Tokens (JWT) encrypted with `NEXTAUTH_SECRET`.
- **RBAC Matrix:**
  | Permission | ADMIN | ANALYST | VIEWER |
  | :--- | :---: | :---: | :---: |
  | View Dashboard & Signals | Yes | Yes | Yes |
  | Query Grounded AI Analyst | Yes | Yes | Yes |
  | Ingest Feedback / CSVs | Yes | Yes | No |
  | Triage Feedback Status | Yes | Yes | No |
  | Re-classify with AI | Yes | Yes | No |
  | Create / Edit Tickets | Yes | Yes | No |
  | Generate VoC Reports | Yes | Yes | No |
  | Manage Workspace Members | Yes | No | No |
  | Delete Reports / Feedback | Yes | No | No |
  | View Audit Logs | Yes | Yes | No |

---

## 3. Enterprise Audit Logging & Credential Redaction

The `lib/audit.ts` service implements automated redaction before database persistence:
- Strips `password`, `passwordHash`, `token`, `secret`, `apiKey`, and `csrfToken` from JSON metadata.
- Records `workspaceId`, `actorEmail`, `actorRole`, `action`, `entity`, and `timestamp`.
- Non-blocking execution guarantees operational resiliency.

---

## 4. Abuse Prevention & Rate Limiting

- **Sliding Window Rate Limiter:** Implemented in `lib/rate-limit.ts`.
- **Signup Endpoint:** 10 requests per minute per IP to prevent automated bot account generation.
- **AI Analyst Endpoint:** 30 queries per minute per workspace to prevent LLM quota exhaustion.
- **Headers:** When rate limited, responses return HTTP 429 with standard `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining` headers.

---

## 5. Input Sanitization & Injection Protection

- **Normalization:** `normalizeFeedbackText()` in `lib/data-quality.ts` neutralizes null bytes (`\u0000`), bell characters (`\u0007`), and control sequences.
- **SQL Injection Prevention:** Prisma ORM parameterizes all SQL queries by design.
- **No Unsafe Raw Execution:** `$executeRawUnsafe` is restricted strictly to local test setup fixtures and never exposed to user inputs.
