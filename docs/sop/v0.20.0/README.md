# v0.20.0 SOP Index — Ocean-Island Architecture

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Status**: DESIGN PHASE (not yet executing)

---

## Document Map

```
docs/adr/0036-ocean-island-architecture.md    ← AUTHORITATIVE (merged PRD + Architecture)
docs/sop/v0.20.0/
  ├── README.md                                ← this file
  ├── SOP-001-dsd-element.md                   ← DsdElement base class
  ├── SOP-002-ssr-css-extraction.md            ← SSR CSSStyleSheet extraction
  ├── SOP-003-open-props-migration.md          ← Design tokens → Open Props
  ├── SOP-004-component-migration-a.md         ← less-card, less-callout, less-step-card
  ├── SOP-005-component-migration-b.md         ← less-button, less-input
  ├── SOP-006-component-migration-c.md         ← less-theme-toggle, less-code-block, less-dialog
  ├── SOP-007-component-migration-d.md         ← less-layout (layered)
  ├── SOP-008-component-migration-e.md         ← less-search
  ├── SOP-009-pure-island-strategy.md          ← less-hero-ping + Island strategy
  ├── SOP-010-css-parts-coverage.md            ← CSS Parts on all components
  ├── SOP-011-build-verification.md            ← Bundle size + import audit + SSG build
  └── SOP-012-regression-testing.md            ← Full regression test matrix
```

## Execution Order

```
Phase 0: Infrastructure (1.3d)
  SOP-001 → SOP-002 → SOP-003

Phase 1: Core Components (1.5d)
  SOP-004 → SOP-005

Phase 2: Interactive Components (2.5d)
  SOP-006 → SOP-007 → SOP-008

Phase 3: Islands + Polish (0.8d)
  SOP-009 → SOP-010

Phase 4: Verification (0.8d)
  SOP-011 → SOP-012

Total: ~6.9 days (single developer, sequential)
```

## Key Decisions

| Decision                                   | Where                |
| ------------------------------------------ | -------------------- |
| DSD components = zero framework dependency | ADR §2.2 D2, D5      |
| Open Props replaces custom tokens          | ADR §2.2 D4, SOP-003 |
| less-hero-ping stays Lit                   | ADR §2.2 D7, SOP-009 |
| adapter-lit retained for Island SSR only   | ADR §2.2 D6          |
| CSS Parts on every component               | ADR §2.2 D8, SOP-010 |

## Before Starting

Read the ADR first. It contains the full rationale, architecture decisions, and before/after comparison. Each SOP references the ADR.
