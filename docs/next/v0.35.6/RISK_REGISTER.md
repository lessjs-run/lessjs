# v0.35.6 Risk Register

> Version: v0.35.6\
> SOP: `docs/sop/v0.35.6/README.md`\
> Updated: 2026-06-07

## Cell Risk Assessment

| Cell | Type          | Risk   | Review Required | Mitigation                            |
| ---- | ------------- | ------ | --------------- | ------------------------------------- |
| 001  | version-bump  | low    | No              | Validates alignment after write       |
| 002  | readme-update | low    | No              | Template-based, no code changes       |
| 003  | test-add      | low    | No              | Additive only (new CI job)            |
| 004  | doc-align     | low    | No              | Documentation only, no runtime impact |
| 005  | typecheck-fix | medium | Yes             | Typecheck gate after each file change |
| 006  | test-add      | low    | No              | Additive only (new bench files)       |
| 007  | test-add      | medium | Yes             | Smoke test isolated in tools/         |
| 008  | doc-align     | low    | No              | CI config additive changes only       |

## Framework Risk Assessment

| Component          | Risk   | Mitigation                                  |
| ------------------ | ------ | ------------------------------------------- |
| AgentCodeGenerator | medium | Safety boundary enforcement + test coverage |
| Metrics Collector  | low    | Read-only operations, no file writes        |
| Evolution Tracker  | low    | Writes to `docs/autoflow/metrics/` only     |

## Identified Risks

### R1: Type cleanup regressions (Cell 005)

- **Likelihood**: Medium
- **Impact**: High (could break runtime behavior)
- **Mitigation**: Run `deno task test` after each file modification.
  Revert individual files if tests fail.

### R2: CI workflow breakage (Cell 003, 008)

- **Likelihood**: Low
- **Impact**: High (CI pipeline unavailable)
- **Mitigation**: Changes are additive (new jobs). Existing jobs untouched.
  Test on a branch before merging.

### R3: AutoFlow safety boundary bypass

- **Likelihood**: Low
- **Impact**: Critical (self-modification of governance tools)
- **Mitigation**: Hard-coded path rejection in AgentCodeGenerator.
  Unit tests verify rejection of all protected paths.

## Deferred Items (v0.36.0)

| Item                       | Deferred Reason                          |
| -------------------------- | ---------------------------------------- |
| adapter-vite decomposition | 4000+ line refactor, high blast radius   |
| SSG parallel rendering     | New architecture, needs design phase     |
| Cross-browser E2E          | CI matrix expansion, infrastructure risk |
| Error boundary enhancement | Core runtime changes, regression risk    |
| Signals documentation      | API not yet stable enough for docs       |
