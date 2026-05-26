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
| Project line              | v0.22.x Architecture Integrity                        |
| Current rendering mode    | SSG + Declarative Shadow DOM                          |
| Current DSD base          | `DsdElement` + SSR-safe `StyleSheet`                  |
| Current framework surface | file routes, Hono API routes, dev/build pipeline      |
| Current Hub surface       | early Registry Hub, validation, snapshots, `less add` |
| Next milestone            | v0.23.x Layered Package Architecture                  |

Package publishing is staggered. The roadmap tracks the project line, while
individual package versions may lag until a coordinated publish pass.

## Phase Overview

| Phase | Version | Name                         | Goal                                                           | Status  |
| ----- | ------- | ---------------------------- | -------------------------------------------------------------- | ------- |
| 1     | v0.15.x | Renderer Kernel              | Structured render output, hooks, build report                  | Done    |
| 2     | v0.16.x | WC Package Protocol          | Manifest + local registry                                      | Done    |
| 3     | v0.17.x | Ecosystem Entry              | Manifest-native pipeline and multi-adapter boundary            | Done    |
| 4     | v0.18.x | Universal WC Engine          | CEM parser, compatibility tiers, validation CLI, safe add flow | Done    |
| 5     | v0.19.x | Registry Hub MVP             | Searchable validated package index with reports and snapshots  | Done    |
| 6     | v0.20.x | Ocean-Island Architecture    | DsdElement, DSD-native UI, CSS Parts, cleanup gates            | Done    |
| 7     | v0.21.x | Reactive DSD                 | DsdElement + Signals, safe templates, streaming DSD            | Done    |
| 8     | v0.22.x | Architecture Integrity       | Package boundaries, consumer surface, adapter cleanup, gates   | Current |
| 9     | v0.23.x | Layered Package Architecture | Protocols, runtime facade, graph gates, docs governance        | Planned |
| 10    | v0.24.x | Edge Full-Stack              | ISR handler, KV adapters, Showcase, deployment guides          | Planned |
| 11    | v0.25.x | Ecosystem Hardening          | Hub trust policy, package evidence, compatibility growth       | Planned |
| 12    | v1.0.x  | Stable Engine                | API/schema freeze and deterministic package guarantees         | Vision  |

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

## Current: v0.22.x - Architecture Integrity

Goal: pay down the architecture and engineering debt exposed by the 2026-05-26
review set before adding more public framework surface.

Scope:

- Consumer `deno.json` simplification and internal dependency hiding
- `@lessjs/core` package boundary cleanup
- Real ownership for extracted packages such as `@lessjs/style-sheet`
- `adapter-vite` decomposition into smaller testable modules
- Signals facade / engine boundary hardening
- Hub, CEM, package manifest, and validation type unification
- Coverage artifacts, generated-consumer E2E proof, Playwright trace, cache
  fallback, and docs/status/roadmap consistency gates

See `docs/sop/v0.22.0/` for detailed SOPs. ADR-0049 is the governing decision.

Non-goals:

- shipping the ISR production handler in v0.22
- shipping CF Workers KV or Deno KV adapters in v0.22
- expanding `@lessjs/ui` from 10 components to 20 components
- adding auth, ORM, database, or generic Node server abstractions
- deleting public imports such as `@lessjs/signals` without a deprecation window

## Planned: v0.23.x - Layered Package Architecture

Goal: turn the v0.22 cleanup line into a durable package architecture before
Edge work resumes.

Scope:

- contracts/protocols ownership for shared build/runtime types
- `@lessjs/core` as runtime kernel, not all-purpose DX barrel
- optional authoring runtime facade versus `@lessjs/app` configuration facade
- `adapter-vite` build-module ownership and shared contract extraction
- package graph, publish order, and generated-consumer gates
- docs/status/roadmap/changelog consistency checks

See `docs/sop/v0.23.0/` for detailed SOPs. ADR-0050 is the governing decision.

Non-goals:

- shipping ISR production handler in v0.23
- shipping KV adapters in v0.23
- expanding Hub marketplace claims in v0.23
- freezing v1.0 APIs

## Planned: v0.24.x - Edge Full-Stack

Goal: resume ADR-0038 after architecture cleanup exits.

Scope:

- ISR production handler (CF Workers / Deno Deploy)
- KvIsrCache adapters (CF Workers KV + Deno KV)
- www Showcase pages (Reactive DSD demo, ISR stopwatch, serverless API)
- Deployment guides (CF Workers, Deno Deploy, static-only)

## Planned: v0.25.x - Ecosystem Hardening

Goal: move from a proof-of-concept Hub index to useful package discovery and
trust evidence.

Exit criteria:

- At least 10 real packages indexed.
- Compatibility badges distinguish SSR-capable, client-only, rejected, and
  snapshot-verified packages.
- Submission trust policy is stricter than schema-shape validation.
- Author-facing Hub submission guide exists.

## Vision: v1.0 Stable Engine

v1.0 should freeze:

- `DsdElement`
- `renderDSD()`
- adapter protocol
- manifest and compatibility schema
- `dsd-report.json`
- `less validate-manifest`
- `less add`
- client-only fallback behavior

v1.0 should not promise:

- SSR for every CEM package
- browser-equivalent DOM simulation
- automatic safe execution of arbitrary package code
- a mature public marketplace

## Cross-Phase Concerns

| Concern                      | Current state                                       | Target                                                       |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| Third-party UI compatibility | Known SSR errors are classified and gated           | More packages with explicit compatibility badges             |
| Full-stack capabilities      | routing, SSG, Hono API routes, ISR metadata         | runtime ISR adapters, deployment parity                      |
| Islands hydration            | `client:*` user-facing strategies                   | richer diagnostics and runtime coverage                      |
| Documentation sync           | SOP-015 governs public docs                         | release checklist blocks stale current-version claims        |
| Test coverage                | strong core/build/e2e base, uneven package coverage | targeted coverage for UI, i18n, create, adapters             |
| Hub scale                    | early index                                         | at least 10 useful packages before stronger market claims    |
| Security                     | audit and admission checks                          | package trust policy, hermetic snapshots, signed submissions |

## Document Cross-Reference

| Document Type | Rhythm                                  | Location                |
| ------------- | --------------------------------------- | ----------------------- |
| SOP           | per patch near-term, per minor far-term | `docs/sop/`             |
| ADR           | decision-driven                         | `docs/adr/`             |
| Changelog     | per patch                               | `docs/changelog/`       |
| Status        | always current                          | `docs/status/STATUS.md` |
| Roadmap       | this document + per-minor pages         | `docs/roadmap/`         |
