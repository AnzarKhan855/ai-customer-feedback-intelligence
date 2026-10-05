# ADR 006: Tenant-Isolated Enterprise Audit Logging

## Status
Accepted

## Context
Enterprise security policies require full traceability of sensitive customer operations (signups, ingestions, status changes, ticket creation, report generation, data exports) while strictly preventing sensitive credential leakage.

## Decision
Introduce a dedicated `AuditLog` entity with indexed `workspaceId`, `action`, `actorEmail`, and `metadata`. Implement `recordAuditLog()` in `lib/audit.ts` that automatically sanitizes sensitive fields (`password`, `token`, `secret`, `apiKey`) before writing.

## Consequences
- **Positive:** Compliant with enterprise security standards, non-blocking asynchronous execution, zero secret leakage in audit logs.
- **Negative:** Additional storage footprint per tenant operation.
