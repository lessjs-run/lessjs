# ADR Index

Architecture Decision Records for LessJS. Each ADR documents a significant
architectural decision, its context, and consequences.

## Format

```
# ADR-NNNN: Title

- Status: PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED
- Date: YYYY-MM-DD

## Context
(Why was this decision needed?)

## Decision
(What was decided?)

## Consequences
(What are the positive, negative, and neutral outcomes?)
```

## Active ADRs

| ADR  | Title                                     | Status                                   |
| ---- | ----------------------------------------- | ---------------------------------------- |
| 0006 | Version Roadmap                           | Accepted                                 |
| 0007 | npm Publishing Strategy                   | Accepted                                 |
| 0010 | Eliminate .less/ temp files               | Accepted, Implemented                    |
| 0011 | Eliminate globalThis bridge               | Accepted, Implemented                    |
| 0016 | Dual-mode subpath resolution              | Accepted, Implemented                    |
| 0017 | Runtime/Build separation                  | Accepted, Implemented                    |
| 0018 | Virtual Data Modules                      | Accepted, Implemented                    |
| 0024 | Standards-first WC Renderer Roadmap       | Accepted                                 |
| 0025 | Renderer Protocol                         | Accepted (v0.15 partial, v0.16 deferred) |
| 0026 | Structured Render Pipeline (v0.16)        | Proposed                                 |
| 0027 | Roadmap Reorder: Engine Before Hub        | Accepted                                 |
| 0028 | Conservative Third-Party WC SSR Admission | Proposed                                 |
| 0029 | Happy DOM for v0.18.3 DOM Simulation      | Proposed                                 |

## Superseded / Historical

(ADR files in `www/content/` from before this docs/ structure was created.)

## New ADRs

Write new ADRs as `NNNN-kebab-case-title.md` in this directory.
