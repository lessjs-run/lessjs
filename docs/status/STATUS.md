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

| Mode                 | State   | Notes                                              |
| -------------------- | ------- | -------------------------------------------------- |
| SSG                  | shipped | default production rendering mode                  |
| DSD                  | shipped | `renderDSD()` outputs declarative shadow roots     |
| Island upgrade       | shipped | binary SSR/client-only boundary exists             |
| Hydration strategies | shipped | `client:load/idle/visible/only` verified           |
| ISR contract         | shipped | `IsrCache`, `MemoryIsrCache`, manifest             |
| API route (Hono)     | shipped | Hono as primary engine, `LessApiContext` type-only |
| Reactive DSD         | shipped | `DsdElement` + Signals, safe templates, streaming  |
| ISR production       | v0.22   | Edge handler + KV adapters (CF Workers, Deno)      |
| www self-hosting     | v0.22   | Showcase pages, ISR demo, serverless API proof     |

## Package Version State

All 16 packages aligned to **v0.21.0**.

## Architecture Positioning

Three pillars:

1. **Application framework** - file routes, dev server, build pipeline, Hono API routes.
2. **DSD/WC rendering engine** - `DsdElement`, `renderDSD()`, adapters, compatibility.
3. **Registry Hub** - discovery, validation, `less add`.

## v0.21.0 - Reactive DSD (9 SOPs)

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

See `docs/sop/v0.21.0/README.md`. Key ADRs: 0039 (Signals), 0040 (Streaming).

## v0.22.0 - Edge Full-Stack (5 SOPs)

| SOP | Title                                           | Priority |
| --- | ----------------------------------------------- | -------- |
| 001 | ISR Production Handler                          | P0       |
| 002 | KV ISR Cache Adapters (CF Workers KV + Deno KV) | P0       |
| 003 | www Showcase Self-Hosting Proof                 | P0       |
| 004 | Deployment Guide                                | P1       |
| 005 | Cleanup + Release Verification                  | P0       |

See `docs/sop/v0.22.0/README.md`. Key ADR: 0038 (ISR + Edge KV).

## Key Decisions

- **Redis adapter removed from core.** TCP is not available on CF Workers.
- **Hono is the API engine.** `LessApiHandler` and `createLessApiContext` are deleted.
- **Signals in DsdElement.** Zero-framework reactivity for Ocean components.
- **No DOM diff in v0.21.** Signal writes rerender the component locally; complex subtrees stay in Islands.
- **Streaming DSD.** Progressive page delivery via Response-compatible Web Streams.
- **Edge Full-Stack is bounded.** v0.22 covers ISR/API/deploy runtime, not auth, ORM, or database ownership.

## Last Completed Line: v0.21.0

Delivered: native `html` TemplateResult support, safe interpolation,
`unsafeHTML()`, Signal-like reactive `DsdElement` updates, runtime template
event/property bindings, Response-compatible `renderDSDStream()`, and removal of
DOM diffing from v0.21 scope.
