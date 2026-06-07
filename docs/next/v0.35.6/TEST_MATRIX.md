# v0.35.6 Test Matrix

## Unit Tests — L2/L3 Framework

| Module               | File                                                    | Coverage                                                                                   |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| agent-code-generator | `tools/autoflow/__tests__/agent-code-generator.test.ts` | Safety boundary rejection, gate execution, file write/read-back, risk-based gate selection |
| executor (existing)  | covered via integration test                            | Three-phase flow with real generator                                                       |
| metrics-collector    | `tools/autoflow/__tests__/agent-code-generator.test.ts` | Cell metrics aggregation, gate score computation                                           |
| evolution-tracker    | existing `evolution-tracker` integration                | Real cycle start/complete, metrics persistence                                             |

## Unit Tests — Existing AutoFlow (must still pass)

| Module             | File                                                  | Coverage                             |
| ------------------ | ----------------------------------------------------- | ------------------------------------ |
| cell-state-machine | `tools/autoflow/__tests__/cell-state-machine.test.ts` | All transitions, illegal rejection   |
| evidence-ledger    | `tools/autoflow/__tests__/evidence-ledger.test.ts`    | Event sourcing replay, state rebuild |
| state-machine      | `tools/autoflow/__tests__/state-machine.test.ts`      | Workflow transitions                 |
| cells              | `tools/autoflow/__tests__/cells.test.ts`              | Cell creation, status strings        |
| integration        | `tools/autoflow/__tests__/integration.test.ts`        | Full pipeline on fixtures            |

## Integration Tests

| Test                   | Fixture / Scenario                      | Expected Outcome                                 |
| ---------------------- | --------------------------------------- | ------------------------------------------------ |
| AgentCodeGenerator E2E | Version drift fixture → Cell 001        | Cell reaches `merged`, EvidenceLedger has events |
| Metrics Collection     | After E2E test above                    | `EvolutionMetrics` has non-zero firstPassRate    |
| Safety Boundary        | Attempt write to `tools/autoflow/x.ts`  | Generator returns `success: false`               |
| TDD Retry Loop         | Mock gate failure on first 2 iterations | Cell retries, eventually passes on iteration 3   |

## Local Gates (pre-commit, must all pass)

```bash
deno task fmt:check
deno task lint
deno check packages/core/src/index.ts packages/*/src/index.ts  # 19 packages
deno task graph:check
deno task docs:check-strategy
deno task docs:check-current
deno run --allow-read --allow-write tools/autoflow/mod-check.ts
deno run --allow-read tools/verify-package-configs.ts
```

## Pre-Push Gates (dev/main only)

```bash
deno task test
deno task build
deno task dsd:check-report
deno task hub:validate -- --strict
deno run --allow-read tools/autoflow/mod-check.ts
```

## CI Jobs (test.yml coverage)

| CI Job            | Package / Scope         | Coverage Flag |
| ----------------- | ----------------------- | ------------- |
| test-core         | `packages/core`         | ✅            |
| test-adapter-vite | `packages/adapter-vite` | ✅            |
| test-rpc          | `packages/rpc`          | ✅            |
| test-ui           | `packages/ui`           | ✅            |
| test-create       | `packages/create`       | ✅            |
| test-i18n         | `packages/i18n`         | ✅            |
| test-content      | `packages/content`      | ✅            |
| test-hub          | `packages/hub`          | ✅            |
| test-adapter-lit  | `packages/adapter-lit`  | ✅            |
| build-www         | `www/`                  | —             |
| test-e2e          | `www/e2e/`              | —             |
| coverage (NEW)    | all packages            | ✅ threshold  |

## Browser Proof

Not applicable for v0.35.6. Cross-browser E2E deferred to v0.36.0.
