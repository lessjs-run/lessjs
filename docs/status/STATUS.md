# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version Line: v0.21.0 (Reactive DSD — PLANNING)

v0.20.1 Status: **SHIPPED.** Hydration strategies, ISR contract, API cleanup.

The current product center is:

> DSD-first Web Components application framework with SSG, progressive islands,
> `client:*` hydration strategies, Hono API routes, ISR cache contract.

See [ADR-0037](../adr/0037-dsd-first-strategic-boundary.md) for positioning,
[ADR-0039](../adr/0039-dsdelement-signals-reactive.md) for Reactive DSD design.

## Current Rendering Mode

| Mode                 | State   | Notes                                            |
| -------------------- | ------- | ------------------------------------------------ |
| SSG                  | shipped | default production rendering mode                |
| DSD                  | shipped | `renderDSD()` outputs declarative shadow roots   |
| Island upgrade       | shipped | binary SSR/client-only boundary exists           |
| Hydration strategies | shipped | `client:load/idle/visible/only` — all 4 verified |
| ISR contract         | shipped | IsrCache interface, MemoryIsrCache, manifest     |
| API route (Hono)     | shipped | Hono as primary engine, LessApiContext type-only |
| Reactive DSD         | v0.21   | DsdElement + Signals, safe templates, streaming  |
| ISR production       | v0.22   | Edge handler + KV adapters (CF Workers, Deno)    |
| www self-hosting     | v0.22   | Showcase pages, ISR demo, serverless API proof   |

## Package Version State

All 13 packages aligned to **v0.20.1**.

## Architecture Positioning

Three pillars:

1. **Application framework** — file routes, dev server, build pipeline, Hono API routes.
2. **DSD/WC rendering engine** — `DsdElement`, `renderDSD()`, adapters, compatibility.
3. **Registry Hub** — discovery, validation, `less add`.

## v0.21.0 — Reactive DSD (5 SOPs)

| SOP | Title                               | Priority |
| --- | ----------------------------------- | -------- |
| 001 | DsdElement + Signals Integration    | P0       |
| 002 | Safe Templates — Automatic Escaping | P0       |
| 003 | Optional DOM Diffing                | P1       |
| 004 | Streaming DSD                       | P1       |
| 005 | Verification + Release Gate         | P0       |

See `docs/sop/v0.21.0/README.md`. Key ADRs: 0039 (Signals), 0040 (Streaming).

## v0.22.0 — Edge Full-Stack (5 SOPs)

| SOP | Title                                         | Priority |
| --- | --------------------------------------------- | -------- |
| 001 | ISR Production Handler (CF/Deno edge server)  | P0       |
| 002 | KvIsrCache Adapters (CF Workers KV + Deno KV) | P0       |
| 003 | www Showcase — Self-Hosting Proof             | P0       |
| 004 | Deployment Guide (CF Workers + Deno Deploy)   | P1       |
| 005 | v0.21 Cleanup + Release Verification          | P1       |

See `docs/sop/v0.22.0/README.md`. Key ADR: 0038 (ISR + Edge KV).

## Key Decisions

- **Redis adapter removed from core.** TCP not available on CF Workers.
- **Hono is the API engine.** LessApiHandler and createLessApiContext deleted.
- **Signals in DsdElement.** Zero-framework reactivity for Ocean components.
- **Streaming DSD.** Progressive page delivery via ReadableStream.

## Last Completed Line: v0.20.1

Delivered: hydration strategies (load/idle/visible/only), client-only SSR exclusion,
ISR contract, MemoryIsrCache, Hono API integration, demo pages, LessApi* cleanup,
IntersectionObserver SSR guard, RedisIsrCache removal.
