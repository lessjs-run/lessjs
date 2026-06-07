# v0.35.6 Acceptance Criteria

> Version: v0.35.6\
> SOP: `docs/sop/v0.35.6/README.md`\
> ADR: ADR-0088, ADR-0089

## L2 Cell Execution Acceptance

| # | Criterion                                            | Method                                |
| - | ---------------------------------------------------- | ------------------------------------- |
| 1 | AgentCodeGenerator writes real files to disk         | `agent-code-generator.test.ts`        |
| 2 | Safety boundaries reject protected paths             | Negative test in test suite           |
| 3 | Gate execution runs after file writes                | Evidence Ledger contains gate records |
| 4 | One cell completes full lifecycle (planned → merged) | `autoflow:evolve` integration test    |
| 5 | mod-evolve.ts replaces DryRunGenerator               | Code review of mod-evolve.ts          |

## L3 Evolution Loop Acceptance

| # | Criterion                                            | Method                               |
| - | ---------------------------------------------------- | ------------------------------------ |
| 6 | Metrics collector produces non-zero EvolutionMetrics | `docs/autoflow/metrics/v0.35.6.json` |
| 7 | Evolution tracker records v0.35.6 cycle              | `evolution-tracker.listCycles()`     |
| 8 | getTrend() returns at least one data point           | `autoflow:health` output             |

## 8 Cell Acceptance

| # | Cell                    | Acceptance Criterion                                    |
| - | ----------------------- | ------------------------------------------------------- |
| 1 | bump-version.ts         | Updates all 19 deno.json, validates alignment           |
| 2 | 5 package READMEs       | All 5 READMEs exist, follow template                    |
| 3 | Coverage CI gate        | CI workflow includes coverage threshold check           |
| 4 | Security usage guide    | docs/guide/security.md exists, covers XSS + trustedHtml |
| 5 | SOP-011 type cleanup    | `as unknown as` count reduced to < 10                   |
| 6 | Render benchmarks       | bench/ directory exists with runnable benchmarks        |
| 7 | Post-publish smoke test | consumer-smoke.ts runs successfully                     |
| 8 | CI gate separation      | Fast gate and full gate are separate CI jobs            |

## Release Gate Acceptance

- [ ] `deno task autoflow:check` exits 0
- [ ] `deno task fmt:check` passes
- [ ] `deno task lint` passes
- [ ] `deno task typecheck` passes
- [ ] `deno task test` passes (all existing tests)
- [ ] `deno task build` succeeds
- [ ] All 19 packages aligned to v0.35.6
- [ ] Evidence Ledger contains events for all executed cells
