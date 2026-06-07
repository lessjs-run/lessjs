# v0.36.0 Risk Register

## Cell Risk Assessment

| Cell | Type          | Risk   | Review Required | Mitigation                         |
| ---- | ------------- | ------ | --------------- | ---------------------------------- |
| 001  | doc-align     | low    | No              | Documentation only                 |
| 002  | doc-align     | low    | No              | Documentation only                 |
| 003  | doc-align     | low    | No              | Version string update              |
| 004  | typecheck-fix | medium | Yes             | typecheck gate after change        |
| 005  | typecheck-fix | medium | Yes             | typecheck gate after change        |
| 006  | test-add      | low    | No              | New file, no existing code change  |
| 007  | adr-write     | high   | Yes             | Human review of package boundary   |
| 008  | refactor      | high   | Yes             | graph:check + typecheck after move |
| 009  | typecheck-fix | high   | Yes             | graph:check + build verification   |
| 010  | test-add      | medium | Yes             | Benchmark comparison required      |
| 011  | test-add      | medium | Yes             | CI test on all browsers            |
| 012  | autoflow      | medium | Yes             | Evidence verification              |
| 013  | autoflow      | low    | No              | Read-only metrics collection       |

## Identified Risks

### R1: adapter-vite decomposition breaks build (Cells 007-009)

- **Likelihood**: Medium
- **Impact**: Critical (SSG pipeline stops working)
- **Mitigation**: Run `deno task build` + `deno task test` after each cell. Revert individual cells if needed.

### R2: Cross-browser E2E reveals rendering bugs (Cell 011)

- **Likelihood**: Medium
- **Impact**: High (may require core rendering fixes)
- **Mitigation**: Run E2E on Chromium first, add browsers incrementally.

### R3: Worker-based SSG has memory issues (Cell 010)

- **Likelihood**: Low
- **Impact**: Medium (SSG slower or OOM on large sites)
- **Mitigation**: Benchmark against sequential, set worker count limit.
