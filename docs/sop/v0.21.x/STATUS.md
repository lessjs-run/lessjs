# LessJS v0.21.x hardening status — v0.21.5 RELEASED

Date: 2026-05-24
Branch: dev
Version: 0.21.5 (all 16 packages)

## Implementation checkpoint

v0.21.x hardening has been applied across the core API surface, DSD conformance
evidence, route-entry generation, Hub trust gates, and reference documentation.

Key changes:

- Core API surface is documented and tested around `DsdElement`, `html`,
  `unsafeHTML()`, `renderDSD()`, and `renderDSDStream()`.
- `RenderError` diagnostics now carry stable `code` and `severity` fields for
  downstream reports and gates.
- DSD output has focused conformance tests for host/template shape,
  `shadowrootmode`, `shadowrootdelegatesfocus`, and manual slot assignment.
- Route `tagName` metadata is resolved during route scanning and carried through
  the entry descriptor, avoiding runtime optional export probing in generated
  SSR code.
- Hub submission validation now requires manifest hashes and non-empty
  artifacts, and `hub-submit` hashes the actual custom-elements manifest when
  present.
- Reference docs now define the public core API, template/reactive contract, and
  Web Component compatibility boundaries.

## Validation result

All required gates passed on 2026-05-24:

- `git status --short --branch`
- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno audit`
- `deno task test`
- `deno task build`
- `deno task dsd:check-report`
- `deno task hub:validate --strict --json`
- `deno task hub:check-index`
- `deno task docs:check-strategy`
- `deno task test:e2e` via Playwright single worker: 92 passed
- `packages/create/__tests__/cli.test.ts`: SSG starter proof (SOP-010 Q4) — scaffolds project,
  patches imports to local source, runs `deno task build`, verifies output HTML

## SOP-010 v0.22 Entry Gate (8/8 cleared)

| # | Question                                                                | Status                                                                      |
| - | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1 | `@lessjs/core` public API classified and documented?                    | ✅ `docs/reference/core-api-surface.md`                                     |
| 2 | Stale contracts removed from types and docs?                            | ✅ `hydrateEvents` deprecated, `render()` TemplateResult-first              |
| 3 | DSD conformance suite tests browser-parsed behavior?                    | ✅ `packages/core/__tests__/dsd-conformance.test.ts`                        |
| 4 | SSG blog/docs path builds from generated project?                       | ✅ `packages/create/__tests__/cli.test.ts` (scaffold + build + verify HTML) |
| 5 | Build warnings and DSD errors fixed or accepted with finite thresholds? | ✅ chunk-size warnings known, DSD 0 unknown, threshold ≤12                  |
| 6 | Hub validation deterministic and strict?                                | ✅ manifestHash 64-char hex + artifact non-empty checks                     |
| 7 | Status and roadmap docs match command results?                          | ✅ STATUS.md matches audit re-run                                           |
| 8 | v0.22 scope still limited to edge/ISR/API/deployment?                   | ✅ SOP-010 lists allowed scope and out-of-scope                             |

## CI Configuration (2026-05-24)

- `SOP Gate` workflow (`.github/workflows/sop-gate.yml`): runs all 11 gates + SSG
  starter proof as isolated job, with summary report.
- `CodeQL` security analysis (`.github/workflows/codeql.yml`): weekly +
  on-push security scans with `security-extended,security-and-quality` queries.

## Copilot Custom Agents (2026-05-24)

Three custom agents in `.github/agents/` provide Copilot Chat assistance:

| Agent                        | File                    | Role                                                  |
| ---------------------------- | ----------------------- | ----------------------------------------------------- |
| ADR & Architecture Reviewer  | `adr-reviewer.agent.md` | Checks code against ADR/SOP constraints               |
| SOP & Implementation Tracker | `sop-gate.agent.md`     | Verifies STATUS.md accuracy, gap analysis             |
| Test & Code Quality Guardian | `test-quality.agent.md` | Coverage gaps, anti-patterns, LessJS-specific quality |

Notes:

- `deno task build` exits 0. Vite still reports a chunk-size warning for the
  documentation build; the repo-level client budget test remains green.
- `dsd:check-report` passes with 112 known third-party Shoelace SSR boundary
  diagnostics, 0 unknown error types, and non-recoverable count within the
  current v0.21.x threshold.
- A parallel Playwright run showed Windows worker teardown/flaky noise; the
  failing accessibility spec passed in isolation, and the full e2e suite passed
  with `--workers=1`.
