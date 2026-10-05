# ADR 005: In-Memory Sliding Window Rate Limiting

## Status
Accepted

## Context
Exposing authentication and generative AI endpoints without rate limiting leaves the platform vulnerable to brute-force credential stuffing and expensive LLM quota exhaustion.

## Decision
Implement an in-memory sliding window rate limiter in `lib/rate-limit.ts` with automated periodic garbage collection of stale timestamps.

## Consequences
- **Positive:** Zero external dependencies (no Redis required for basic deployment), sub-millisecond evaluation latency, standard HTTP 429 response formatting with `Retry-After`.
- **Negative:** Rate limit counters are local to the serverless container instance. For distributed multi-region deployments at massive scale, Redis/Upstash can be layered transparently behind the same interface.
