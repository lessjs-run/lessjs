# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version Line: v0.22.0 (PLANNING)

v0.21 Status: **COMPLETED.** All 10 SOPs implemented.

The current product center is:

> DSD-first Web Components application framework with SSG, progressive islands,
> `client:*` hydration strategies, Hono API routes, ISR cache contract (v0.21),
> and ISR production handler + KV adapters + www self-hosting proof (v0.22).

See [ADR-0037](../adr/0037-dsd-first-strategic-boundary.md) for positioning,
[ADR-0038](../adr/0038-isr-edge-kv-architecture.md) for ISR + Edge KV design.

## Current Rendering Mode

| Mode                 | State   | Notes                                            |
| -------------------- | ------- | ------------------------------------------------ |
| SSG                  | shipped | default production rendering mode                |
| DSD                  | shipped | `renderDSD()` outputs declarative shadow roots   |
| Island upgrade       | shipped | binary SSR/client-only boundary exists           |
| Hydration strategies | shipped | `client:load/idle/visible/only` — all 4 verified |
| ISR contract         | shipped | IsrCache interface, MemoryIsrCache, manifest     |
| ISR production       | v0.22   | Edge handler + KV adapters (CF Workers, Deno)    |
| API route (Hono)     | shipped | Hono as primary engine, LessApiContext type-only |
| www self-hosting     | v0.22   | Showcase pages, ISR demo, serverless API proof   |

## Package Version State

All 13 packages aligned to **v0.21.0**.

## Architecture Positioning

Three pillars:

1. **Application framework** — file routes, dev server, build pipeline, Hono API routes.
2. **DSD/WC rendering engine** — `DsdElement`, `renderDSD()`, adapters, compatibility.
3. **Registry Hub** — discovery, validation, `less add`.

The strongest moat is pillar 2 (DSD rendering engine) + Hub evidence pipeline.

## v0.22.0 Roadmap (5 SOPs)

| SOP | Title                                         | Priority |
| --- | --------------------------------------------- | -------- |
| 001 | ISR Production Handler (CF/Deno edge server)  | P0       |
| 002 | KvIsrCache Adapters (CF Workers KV + Deno KV) | P0       |
| 003 | www Showcase — Self-Hosting Proof             | P0       |
| 004 | Deployment Guide (CF Workers + Deno Deploy)   | P1       |
| 005 | v0.21 Cleanup + Release Verification          | P1       |

See `docs/sop/v0.22.0/README.md` for full details.

## Key Decisions (v0.21 → v0.22)

- **Redis adapter removed from core.** TCP not available on CF Workers. KV adapters (CF/Deno) are the primary backends.
- **Hono is the API engine.** LessApiHandler and createLessApiContext deleted. LessApiContext is type-only.
- **ISR is NOT SSR.** Same `renderDSD()` engine, different invocation timing — ADR-0033 confirmed.
- **www proves itself.** v0.22 ships showcase + ISR demo + API routes on the live site.

## Last Completed Line: v0.21.0

Delivered: hydration strategies (load/idle/visible/only), client-only SSR exclusion,
ISR contract + manifest, MemoryIsrCache, API route Hono integration, demo pages,
LessApi* runtime cleanup, IntersectionObserver SSR guard, 13 packages @ 0.21.0.
