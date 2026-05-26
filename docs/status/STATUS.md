# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version Line: v0.22.x (Architecture Integrity - IN PROGRESS)

v0.21.0 Status: **IMPLEMENTED.** Reactive DSD runtime, safe templates, streaming
DSD.

v0.22.x Status: **IN PROGRESS.** Architecture Integrity cleanup is the active
line: package boundaries, consumer surface, adapter decomposition, validation
ownership, and release gates.

The current product center is:

> DSD-first Web Components application framework with SSG, progressive islands,
> `client:*` hydration strategies, Hono API routes, Reactive DSD, and ISR cache
> contract.

See [ADR-0037](../adr/0037-dsd-first-strategic-boundary.md) for positioning,
[ADR-0049](../adr/ADR-0049-architecture-debt-first-roadmap-reset.md) for the
v0.22 cleanup reset, and
[ADR-0050](../adr/ADR-0050-layered-package-architecture.md) for the v0.23
layered package architecture decision.

## Current Rendering Mode

| Mode                 | State   | Notes                                                 |
| -------------------- | ------- | ----------------------------------------------------- |
| SSG                  | shipped | default production rendering mode                     |
| DSD                  | shipped | `renderDSD()` outputs declarative shadow roots        |
| Island upgrade       | shipped | binary SSR/client-only boundary exists                |
| Hydration strategies | shipped | `client:load/idle/visible/only` verified              |
| ISR contract         | shipped | `IsrCache`, `MemoryIsrCache`, manifest                |
| API route (Hono)     | shipped | Hono as primary engine, `LessApiContext` type-only    |
| Reactive DSD         | shipped | `DsdElement` + Signals, safe templates, streaming     |
| Architecture cleanup | v0.22   | Package boundaries, consumer surface, adapter cleanup |
| Layered architecture | v0.23   | contracts, runtime facade, package graph gates        |
| ISR production       | v0.24+  | Edge handler + KV adapters (CF Workers, Deno)         |
| www self-hosting     | v0.24+  | Showcase pages, ISR demo, serverless API proof        |

## Package Version State

All packages are on the v0.22 line. `@lessjs/create` may advance by patch
version independently when generated-project smoke fixes must be republished.

## Architecture Positioning

Three pillars:

1. **Application framework** - file routes, dev server, build pipeline, Hono API routes.
2. **DSD/WC rendering engine** - `DsdElement`, `renderDSD()`, adapters, compatibility.
3. **Registry Hub** - discovery, validation, `less add`.

## v0.21.0 - Reactive DSD (10 SOPs)

| SOP | Title                                               | Priority |
| --- | --------------------------------------------------- | -------- |
| 001 | DsdElement + Signals Integration                    | P0       |
| 002 | Safe Templates                                      | P0       |
| 003 | Streaming DSD                                       | P1       |
| 004 | Integration Depth + DX                              | P0       |
| 005 | Verification + Release Gate                         | P0       |
| 006 | Unified Event Model — hydrateEvents Retirement      | P0       |
| 007 | Core Package Split — compat-check, cem, style-sheet | P0       |
| 008 | ReactiveHost Protocol — explicit Signal integration | P0       |
| 009 | Closure & Remediation — fix all review gaps         | P0       |
| 010 | Architect Review Remediation — code quality fixes   | P1       |

See `docs/sop/v0.21.0/README.md`. Key ADRs: 0039 (Signals), 0040 (Streaming).

## v0.22.0 - Architecture Integrity (5 SOPs)

| SOP | Title                                     | Priority |
| --- | ----------------------------------------- | -------- |
| 001 | Consumer Surface Cleanup                  | P0       |
| 002 | Package Boundary Repair                   | P0       |
| 003 | adapter-vite Decomposition                | P0       |
| 004 | Signals, Schema, and Validation Hardening | P1       |
| 005 | Quality Gates and Release Closure         | P0       |

See `docs/sop/v0.22.0/README.md`. Key ADR: 0049 (Architecture Debt First
Roadmap Reset). ADR-0038 (ISR + Edge KV) remains accepted but is deferred to
v0.24 or later.

## v0.23.0 - Layered Package Architecture (6 SOPs)

| SOP | Title                                       | Priority |
| --- | ------------------------------------------- | -------- |
| 001 | Contracts and Protocols Package             | P0       |
| 002 | Core Runtime Kernel Boundary                | P0       |
| 003 | Runtime and App Facades                     | P0       |
| 004 | adapter-vite Build Modularity               | P0       |
| 005 | Package Graph and Consumer Gates            | P0       |
| 006 | Docs Governance and Open Source Positioning | P1       |

See `docs/sop/v0.23.0/README.md`. Key ADR: 0050 (Layered Package
Architecture). Edge Full-Stack moves to v0.24 or later.

## Key Decisions

- **Redis adapter removed from core.** TCP is not available on CF Workers.
- **Hono is the API engine.** `LessApiHandler` and `createLessApiContext` are deleted.
- **Signals in DsdElement.** Zero-framework reactivity for Ocean components.
- **No DOM diff in v0.21.** Signal writes rerender the component locally; complex subtrees stay in Islands.
- **Streaming DSD.** Progressive page delivery via Response-compatible Web Streams.
- **Unified event model.** `@click` in `html` templates is the sole event binding mechanism; `hydrateEvents` removed.
- **ReactiveHost protocol.** Explicit `subscribeTo()` / `requestReactiveUpdate()` contract replaces Duck Typing.
- **Core package split.** `@lessjs/compat-check`, `@lessjs/cem`, `@lessjs/style-sheet` extracted as independent packages.
- **Fine-grained DOM patching.** `_patchBindings()` with `data-less-b` markers preserves focus/scroll/CSS transitions.
- **Architecture cleanup before feature expansion.** v0.22 covers package
  boundaries, consumer surface, adapter decomposition, validation ownership, and
  stronger gates before Edge Full-Stack work resumes.
- **Layered package architecture before Edge Full-Stack.** v0.23 covers
  contracts, core/runtime/app facade boundaries, adapter modularity, package
  graph gates, and docs governance before Edge work resumes.

## Last Completed Line: v0.21.0

Delivered: native `html` TemplateResult support, safe interpolation,
`unsafeHTML()`, Signal-like reactive `DsdElement` updates, runtime template
event/property bindings, Response-compatible `renderDSDStream()`, unified event
model (`@click` only), ReactiveHost protocol, core package split, fine-grained
DOM patching, 787 tests passing with zero failures, and removal of DOM diffing
from v0.21 scope. Full SOP coverage: 9 SOPs (001–009) all implemented.
