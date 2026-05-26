# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version Line: v0.21.0 (Reactive DSD - IMPLEMENTED)

v0.21.0 Status: **IMPLEMENTED.** Reactive DSD runtime, safe templates, streaming
DSD.

The current product center is:

> DSD-first Web Components application framework with SSG, progressive islands,
> `client:*` hydration strategies, Hono API routes, Reactive DSD, and ISR cache
> contract.

See [ADR-0037](../adr/0037-dsd-first-strategic-boundary.md) for positioning,
[ADR-0039](../adr/0039-dsdelement-signals-reactive.md) for Reactive DSD design,
and [ADR-0040](../adr/0040-streaming-dsd.md) for Streaming DSD.

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
| ISR production       | v0.23+  | Edge handler + KV adapters (CF Workers, Deno)         |
| www self-hosting     | v0.23+  | Showcase pages, ISR demo, serverless API proof        |

## Package Version State

All 16 packages aligned to **v0.21.0**.

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
v0.23 or later.

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

## Last Completed Line: v0.21.0

Delivered: native `html` TemplateResult support, safe interpolation,
`unsafeHTML()`, Signal-like reactive `DsdElement` updates, runtime template
event/property bindings, Response-compatible `renderDSDStream()`, unified event
model (`@click` only), ReactiveHost protocol, core package split, fine-grained
DOM patching, 787 tests passing with zero failures, and removal of DOM diffing
from v0.21 scope. Full SOP coverage: 9 SOPs (001–009) all implemented.
