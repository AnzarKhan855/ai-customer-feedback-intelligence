# ADR 003: Hybrid Dense-Lexical Semantic RAG 2.0

## Status
Accepted

## Context
Pure vector embedding similarity (e.g. naive cosine distance) struggles with exact keyword queries (such as ticket IDs, feature names, or acronyms), leading to semantic false-positive collisions. Pure keyword search (BM25) fails to capture semantic paraphrasing and emotional intent.

## Decision
Implement a hybrid scoring function combining 64-dimensional semantic hashing vectors with lexical token and morphological stem overlap:
`score = 0.35 * semanticScore + 0.65 * lexicalOverlap`

## Consequences
- **Positive:** High precision on keyword queries, robust recall on paraphrased questions, zero external vector database infrastructure required.
- **Negative:** Vector dimension capped at 64 for in-memory compute efficiency.
