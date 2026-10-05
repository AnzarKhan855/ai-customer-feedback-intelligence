# AI, NLP & RAG Architecture — LOOP 2.0

## 1. Multi-Stage NLP Intelligence Pipeline

When feedback enters LOOP 2.0, it passes through 7 distinct analytical layers:

```
Feedback Raw Text
       │
       ├──► 1. Sentiment Polarity & Score (-1.0 to +1.0)
       ├──► 2. Plutchik-8 Emotion Classification (Anger, Frustration, Disappointment, etc.)
       ├──► 3. Aspect-Based Sentiment Analysis (ABSA) (Granular score per feature aspect)
       ├──► 4. 9-Class Intent Detection (Bug, Feature Request, Churn Threat, etc.)
       ├──► 5. Explainable 0-100 Severity Scoring Formula
       ├──► 6. Churn Risk Signal & Competitor Mentions
       └──► 7. Root Cause Hypothesis Synthesis
```

---

## 2. Plutchik-8 Emotion Taxonomy

Customer sentiment is mapped into Robert Plutchik's 8 primary emotion axes:
1. **Anger:** Extreme dissatisfaction, billing overcharges, critical outages.
2. **Frustration:** Bottlenecks, timeouts, repetitive workflow hurdles.
3. **Disappointment:** Missing anticipated capabilities, unmet expectations.
4. **Concern:** Security questions, data privacy, billing ambiguity.
5. **Confusion:** Complex onboarding, ambiguous documentation, navigation difficulty.
6. **Satisfaction:** Stable operations, task completion without incident.
7. **Happiness:** Rapid responses, delightful UX improvements.
8. **Excitement:** Strategic feature releases, major productivity boosts.

---

## 3. Explainable Severity Score (0–100 Scale)

Instead of subjective priority flags, severity is computed transparently:
$$\text{Base Score} = 25$$
- **+30 points:** Critical operational issues (data loss, SSO lockout, security vulnerability).
- **+25 points:** High urgency keywords (blocking, crash, timeout, broken).
- **+20 points:** High emotional intensity (anger, frustration).
- **+15 points:** Churn / cancellation threat detected.
- **-15 points:** Minor aesthetic suggestion or positive praise.
- Clamped strictly between `5` and `100`.

---

## 4. Hybrid Dense-Lexical Semantic RAG 2.0

### Vector Representation
- 64-dimensional semantic hashing vectors generated via stopword filtering and dense n-gram weighting.
- Normalized Euclidean unit vectors: $\|\vec{v}\| = 1.0$.

### Hybrid Ranking Function
$$\text{Score} = 0.35 \times \text{CosineSimilarity}(\vec{q}, \vec{d}) + 0.65 \times \text{LexicalOverlap}(q, d)$$

This prevents vector hash collisions on keyword-specific queries while preserving semantic retrieval breadth.

### Anti-Hallucination Guarantees
1. **No External Citations:** The model is prohibited from citing records not present in the retrieved candidate set.
2. **Pre-Computed Statistics:** Numerical metrics (sentiment proportions, average severity, counts) are calculated deterministically in TypeScript and passed as immutable context to prevent LLM numerical hallucination.
