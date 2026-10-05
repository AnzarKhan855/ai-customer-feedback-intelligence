# ADR 004: Adoption of Plutchik-8 Emotion Taxonomy for Feedback Analytics

## Status
Accepted

## Context
Standard ternary sentiment (Positive, Neutral, Negative) is insufficient for enterprise customer intelligence. An executive cannot distinguish between an annoyed customer experiencing a UI bug versus an enraged customer threatening contract cancellation.

## Decision
Classify customer emotion across Robert Plutchik's 8 primary axes:
`anger`, `frustration`, `disappointment`, `concern`, `confusion`, `satisfaction`, `happiness`, `excitement`.

## Consequences
- **Positive:** Enables precise risk stratification, prioritizes retention interventions, and provides actionable emotional context for engineering and product teams.
- **Negative:** Requires multi-class classification and confidence thresholding.
