# LessJS Roadmap

> Source of truth for version planning.
> Strategic boundary: [ADR-0037](../adr/0037-dsd-first-strategic-boundary.md).

## Principle

LessJS promises deterministic outcomes, not universal magic.

A Web Component is SSR-rendered only when a declared adapter or validated
package contract makes that safe. Otherwise it becomes client-only or fails
validation before build output is generated.

The current product center is **DSD-first Web Components rendering**. Full-stack
capabilities are still important, but they must build on clean package
boundaries, a small consumer surface, and verified release gates instead of
outrunning the architecture.

## Current State

| Area                      | State                                                 |
| ------------------------- | ----------------------------------------------------- |
| Project line              | v0.24.4 API Naming Consolidation                      |
| Current rendering mode    | SSG + Declarative Shadow DOM                          |
| Component model           | JSX + static props + Signal (ADR-0057)                |
| Public API naming         | Web Platform style: verbNoun, PascalCase acronyms     |
| Current DSD base          | `DsdElement` + SSR-safe `StyleSheet`                  |
| Current framework surface | file routes, Hono API routes, dev/build pipeline      |
| Current Hub surface       | early Registry Hub, validation, snapshots, `less add` |
| Next milestone            | v0.25.0 Declarative DX                                |

## Phase Overview

| Phase | Version     | Name                         | Goal                                                           | Status  |
| ----- | ----------- | ---------------------------- | -------------------------------------------------------------- | ------- |
| 1–6   | v0.15–v0.20 | Ocean-Island Architecture    | DSD-first rendering, CEM, Hub, gates                           | ✅ Done |
| 7     | v0.21.x     | Reactive DSD                 | DsdElement + Signals, safe templates, streaming DSD            | ✅ Done |
| 8     | v0.22.x     | Architecture Integrity       | Package boundaries, consumer surface, adapter cleanup, gates   | ✅ Done |
| 9     | v0.23.x     | Layered Package Architecture | Protocols, runtime facade, graph gates, docs governance        | ✅ Done |
| 10    | v0.24.1     | JSX + Signal Component Model | JSX, static props, Signal unwrap, DSD integration (ADR-0057)   | ✅ Done |
| 10.1  | v0.24.2     | Remove Old Component Model   | html/@prop removal, renderer hardening, docs truth convergence | ✅ Done |
| 10.2  | v0.24.3     | Consolidation                | TemplateResult removal, TemplateRunner dedup, gate hardening   | ✅ Done |
| 10.3  | v0.24.4     | API Naming Convention        | verbNoun, PascalCase acronyms, brand prefix removal            | ✅ Done |
| 11    | v0.25.0     | Declarative DX               | BuildPipeline, route types, static head, static client         | ✅ Done |
| 12    | v0.26.0     | Hub CLI Reorganization       | Hub command surface, package publish sanity                    | ✅ Done |
| 13    | v0.27.0     | Framework Decoupling         | Virtual module removal, island transform, dev:fast server      | ✅ Done |
| 14    | v0.28.0     | Contracts & Tokens           | Adapter registry factory, Open Props migration, CI composite   | ✅ Done |
| 14.1  | v0.28.1     | Hygiene Convergence          | v0.28 anchor sweep, gitignore leaks, strategic-docs sync       | Active  |
| 15    | v1.0.x      | Stable Engine                | API/schema freeze and deterministic package guarantees         | Vision  |

## Compatibility Admission Model

| Package/component state                                     | Outcome                                       | Build behavior                                                |
| ----------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| Less manifest says `ssr: true` and a renderer can handle it | SSR/SSG                                       | Render through declared adapter                               |
| Less manifest says `ssr: false`                             | Client-only                                   | Do not import/register in SSR bundle; emit hydration metadata |
| CEM exists but no Less SSR declaration exists               | Client-only by default                        | Validate metadata, do not assume SSR                          |
| No CEM and no Less manifest                                 | Reject or require manual config               | Avoid guessing package shape                                  |
| Duplicate custom-element tags                               | Reject unless scoped registry support applies | Avoid global registry conflict                                |
| Browser-only render dependency is detected                  | Client-only or explicit experimental path     | Report reason in diagnostics                                  |
| DOM simulation is enabled                                   | Experimental opt-in                           | Timeout-bound, isolated, and reported                         |

## Completed Phases

### v0.15.x - Renderer Kernel

Delivered:

- `RenderOutput`, `RenderError`, and `HydrationHint` structured types
- `RendererProtocol` with named adapters
- `RenderHooks` lifecycle
- `DsdBuildReport` and `dsd-report.json`
- repeatable release gates

Exit criteria: met.

### v0.16.x - WC Package Protocol

Delivered:

- manifest and registry types
- package island metadata expansion
- local registry validation
- package metadata as data instead of runtime guessing

Exit criteria: met.

### v0.17.x - Ecosystem Entry

Delivered:

- manifest-native adapter-vite pipeline
- client-only SSR filtering
- local island admission planning
- Vanilla and React adapter exploration
- compatibility boundary hardening

Exit criteria: met.

### v0.18.x - Universal WC Engine

Delivered:

- CEM parser and compatibility classifier
- `less validate-manifest`
- `less add` dry-run/install workflow
- explicit opt-in DOM simulation experiment

Exit criteria: met.

### v0.19.x - Registry Hub MVP

Delivered:

- package search and detail pages
- manifest and compatibility report ingestion
- bundle size and hydration metadata
- `less hub submit`
- GitHub Actions submission gate
- component browser and rendered previews
- Playwright snapshot rendering for client-only packages

Exit criteria: met for MVP. Not yet a mature marketplace.

### v0.20.x - Ocean-Island Architecture

Delivered:

- `DsdElement` in `@lessjs/core`
- SSR-safe `StyleSheet` abstraction
- DSD-native `@lessjs/ui` migration for ocean components
- Open Props token migration
- CSS Parts coverage
- `@lessjs/adapter-lit` deprecation for DSD components
- `less-hero-ping` retained as the Lit island example
- DSD report gate tightened to finite thresholds
- ADR-0037 strategic boundary and SOP-015 docs alignment

Exit criteria:

- DSD components no longer depend on Lit.
- `deno task dsd:check-report` fails on unknown error classes.
- README, roadmap, status, and website docs no longer describe v0.18/v0.19 as
  the current public line.

### v0.21.x - Reactive DSD

Goal: make `DsdElement` the universal reactive base class via Signals integration.
Ocean components gain reactivity without Lit, React, or any framework runtime.

Scope:

- DsdElement + Signals subscription tracking for TemplateResult values
- Microtask-batched component-local rerendering for Signal writes
- `html` tagged template literal (zero build step, XSS-safe by default)
- Safe templates: automatic escaping, `unsafeHTML()` escape hatch
- Streaming DSD: `renderDSDStream()` -> `ReadableStream<Uint8Array>`
- Progressive page delivery: TTFB < 50ms, per-component chunking
- Priority ordering: above-fold first, below-fold deferred
- No DOM diff in v0.21: complex UI remains an Island responsibility

See `docs/sop/v0.21.0/` for detailed SOPs.

## Completed: v0.22–v0.24 — Architecture Integrity through API Consolidation ✅

### v0.22.x - Architecture Integrity

Package boundaries, consumer surface, adapter cleanup, release gates.
See `docs/sop/v0.22.0/`. ADR-0049 is the governing decision.

### v0.23.x - Layered Package Architecture

Protocols, runtime facade, app facade, graph gates, docs governance.
See `docs/sop/v0.23.0/`. ADR-0050 is the governing decision.

### v0.24.1 — JSX + Signal Component Model (ADR-0057)

JSX template, static props, Signal unwrap, DSD integration.
See `docs/sop/v0.24.1/`. ADR-0057 (v2) is the governing decision.

### v0.24.2 — Remove Old Component Model

html/@prop removal, renderer hardening, docs truth convergence.
See `docs/sop/v0.24.3/`.

### v0.24.3 — Consolidation

TemplateResult removal, type dedup, gate hardening.
See `docs/sop/v0.24.3/`.

### v0.24.4 — API Naming Convention (SOP-001)

verbNoun, PascalCase acronyms, brand prefix removal across 100+ files.
See `docs/sop/v0.24.4/`, `docs/release/0.24.4.md`.

## Planned: v0.25.0 — Declarative DX

Goal: eliminate architecture debt, add type-safe routes, unify DX.

Governing ADR: ADR-0058, ADR-0059, ADR-0060. See `docs/sop/v0.25.0/`.

| Group | Task                               | Priority | Nature           |
| ----- | ---------------------------------- | -------- | ---------------- |
| TG-01 | `lessPipeline()` declarative API   | P0       | Pure refactor    |
| TG-02 | `RouteParams` type generation      | P0       | Code generation  |
| TG-03 | `static head` metadata             | P1       | Small feature    |
| TG-04 | `static client` island declaration | P1       | Syntax sugar     |
| TG-05 | SignalContext (DOM-tree)           | P2*      | ~20 lines        |
| TG-06 | CSS token injection convergence    | P1       | Token dedup      |
| TG-07 | route-scanner regex → AST          | P1       | TS AST upgrade   |
| TG-08 | `as any` type hardening            | P1       | Type safety      |
| TG-09 | Test path unification              | P2       | Test utils       |
| TG-10 | `less()` @deprecated               | P2       | Docs             |
| TG-11 | island.test.ts old name fix        | P2       | Docs             |
| TG-12 | `_dsdHydrated` dual-path merge     | P1       | Runtime refactor |
| TG-13 | 31 pages string → JSX migration    | P1       | Content refactor |
| TG-14 | Full regression + docs             | P2       | Verification     |

> *P2 conditional: requires `computed()` to have ≥1 real-world use first.
> TG-06 through TG-13 are architecture debt from 2026-05-29 comprehensive audit.

## Planned: v0.27.0 — Reactive Pragmatic + Framework Decoupling

Goal: SPA navigation-aware params + keep-alive + framework-Vite decoupling (zero virtual modules).

Governing ADR: ADR-0059, ADR-0061. See `docs/sop/v0.27.0/`.

| Group | Task                               | Priority | Nature       |
| ----- | ---------------------------------- | -------- | ------------ |
| TG-01 | `this.params` SPA-reactive         | P0       | New feature  |
| TG-02 | `data-keep-alive` DOM preservation | P1       | Bug fix      |
| TG-03 | `computed()` documentation         | P2       | Docs         |
| TG-04 | Virtual modules removal (SOP-001)  | P0       | Refactor     |
| TG-05 | Entry renderer cleanup (SOP-002)   | P0       | Refactor     |
| TG-06 | Island transform extraction (003)  | P1       | Refactor     |
| TG-07 | Dev server zero bundler (SOP-004)  | P1       | New feature  |
| TG-08 | Adapter cleanup + regression (005) | P1       | Verification |

## Explicitly Excluded

| Excluded                  | Reason                              |
| ------------------------- | ----------------------------------- |
| `static data` SSG fetch   | Content system already handles data |
| `static middleware`       | 0 file uses                         |
| SignalQuery               | Promise-style RPC sufficient        |
| Edge Full-Stack (ISR, KV) | Deferred until architecture clean   |

## Vision: v1.0 Stable Engine

v1.0 should freeze: `DsdElement`, `renderDsd()`, adapter protocol, manifest and
compatibility schema, `dsd-report.json`, `less validate-manifest`, `less add`,
client-only fallback behavior.

v1.0 should not promise: SSR for every CEM package, browser-equivalent DOM
simulation, automatic safe execution of arbitrary package code, a mature
public marketplace.

## Document Cross-Reference

| Document Type | Rhythm                                  | Location                |
| ------------- | --------------------------------------- | ----------------------- |
| SOP           | per patch near-term, per minor far-term | `docs/sop/`             |
| ADR           | decision-driven                         | `docs/adr/`             |
| Changelog     | per patch                               | `docs/changelog/`       |
| Status        | always current                          | `docs/status/STATUS.md` |
| Roadmap       | this document + per-minor pages         | `docs/roadmap/`         |
| Release Note  | per version                             | `docs/release/`         |
