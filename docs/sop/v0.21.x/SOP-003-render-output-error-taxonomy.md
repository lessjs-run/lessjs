# SOP-003: Render Output and Error Taxonomy Stabilization

Status: planned\
Target version: v0.21.1\
Owner: core package and adapter-vite package

## Objective

Make renderer output, metrics, hydration hints, and errors precise enough for build reports, SSG verification, streaming, and future edge runtime entrypoints.

## Evidence Inputs

- `packages/core/src/render-dsd.ts`
- `packages/core/src/render-stream.ts`
- `packages/core/src/render-nested.ts`
- `packages/core/src/errors.ts`
- `packages/core/src/types.ts`
- `packages/adapter-vite/src/`
- `www/dist/dsd-report.json` when produced by build

## Problem Statement

The current renderer already has useful evidence output, but v0.21.x needs stronger guarantees:

- errors must be typed and actionable;
- recoverable DSD issues must not look the same as hard build failures;
- render metrics must be stable enough for budget gates;
- hydration hints must be traceable to island admission;
- streaming and non-streaming render paths must report compatible information.

## Scope

Stabilize:

- `RenderOutput`
- `RenderMetrics`
- `HydrationHint`
- `DsdRenderCollector`
- render error classes and codes
- build report schema consumed by `dsd:check-report`

## Procedure

1. Inventory every renderer error shape currently emitted.
2. Define a minimal error taxonomy:
   - invalid component contract;
   - invalid DSD output;
   - unsafe template or attribute issue;
   - island admission issue;
   - adapter resolution issue;
   - streaming interruption.
3. Give every error a stable code, severity, package owner, and suggested remediation.
4. Make `renderDsd()` and `renderDSDStream()` report compatible metadata where possible.
5. Decide which report fields are public and which are adapter-internal.
6. Add tests that snapshot representative error output without overfitting entire JSON files.
7. Update `dsd:check-report` thresholds so known errors are intentional, documented, and finite.

## API Design Rules

- Error codes are stable public contracts once documented.
- Error messages may improve, but code and severity must not churn.
- Reports must be deterministic across repeated builds.
- Streaming must not erase component-level error context.
- Metrics should be useful for budgets, not just debugging.

## Acceptance Criteria

- `renderDsd()` and `renderDSDStream()` have a documented output contract.
- `dsd:check-report` fails on real regressions instead of accepting unlimited known errors.
- Build reports explain route, component, severity, and next action.
- At least one test covers a streaming error path.
- At least one test covers an island admission error path.

## Validation Commands

```powershell
git status --short --branch
deno task fmt:check
deno task lint
deno task typecheck
deno test packages/core packages/adapter-vite
deno task build
deno task dsd:check-report
git status --short --branch
```

## Exit Decision

Proceed to SOP-004 when renderer evidence is trustworthy enough to use as a standards conformance signal.
