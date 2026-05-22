# LessJS v0.22.0 — Edge Full-Stack

> Status: PLANNING
> Target: ISR production handler + KV adapters + www self-hosting proof

## Vision

v0.22 closes the ISR loop: from build-time contract (v0.21) to runtime production
handler. The framework's own website proves every capability it claims.

## SOP Index

| SOP | Title                                       | Priority |
| --- | ------------------------------------------- | -------- |
| 001 | ISR Production Handler                      | P0       |
| 002 | KvIsrCache Adapters (CF KV + Deno KV)       | P0       |
| 003 | www Showcase — Self-Hosting Proof           | P0       |
| 004 | Deployment Guide (CF Workers + Deno Deploy) | P1       |
| 005 | v0.21 Cleanup + Release Verification        | P1       |

## Architecture Principle

LessJS ISR is NOT "adding SSR." It is reusing the same `renderDSD()` engine
(ADR-0033) behind an HTTP endpoint. The adapter pattern (`IsrCache` interface)
enables platform-native KV backends without framework-level infrastructure.

## Key Decisions

- **No Redis adapter in core.** CF Workers cannot make TCP connections. Redis
  users can build a community adapter implementing the `IsrCache` interface.
- **CF Workers KV is the primary ISR backend** (matches existing deployment).
- **Deno KV is the secondary backend** for Deno Deploy users.
- **www IS the proof.** Not docs — the live site demonstrates every capability.
