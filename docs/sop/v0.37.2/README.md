# v0.37.2 SOP: SSR / ISR Server Runtime Contract

> Status: Active\
> Roadmap: Four-Product Validation Train\
> Depends on: v0.37.0\
> NextVersion: `docs/next/v0.37.2/`

## Goal

Promote SSR, Streaming DSD, and ISR from scattered evidence into a coherent
framework runtime contract.

## Entry Criteria

- v0.37.0 doctrine reset is complete.
- Existing `IsrCache`, `MemoryIsrCache`, `FileIsrCache`, `renderDsdStream()`,
  route `revalidate`, and `isr-manifest.json` behavior has been audited.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0038: ISR + Edge KV Architecture.
- ADR-0040: Streaming DSD.
- ADR-0093: SSR / ISR Runtime Contract.

## Step-by-Step Tasks

1. Audit current build-time SSR bundle and SSG handoff.
2. Audit current request-time SSR gaps and document what is shipped versus
   evidence-only.
3. Define the request-time SSR boundary without binding the framework to one
   host.
4. Define ISR runtime flow: manifest lookup, cache key, hit, stale, miss,
   regeneration handoff, and error handling.
5. Keep memory and file cache as baseline implementations.
6. Define adapter slots for Deno KV, Cloudflare KV/D1, and custom caches as
   future recipes, not required defaults.
7. Add fixtures proving route `revalidate` produces manifest and report
   evidence.
8. Add docs for deployment/runtime integration.

## Verification

- ISR unit tests.
- SSG render tests for manifest entries.
- Streaming DSD tests.
- build and dsd report gates.
- generated fixture smoke where practical.

## Non-Goals

- No built-in hosting platform.
- No required Cloudflare dependency.
- No database ownership.
- No auth/session framework.

## Exit Criteria

- Users can understand static, request-time SSR, streaming, and ISR boundaries.
- The ISR cache contract has baseline proof and adapter extension points.
- v0.37.6 can use the contract in a starter smoke.

## AutoFlow Boundary

AutoFlow may prove manifest/cache/report evidence. It must not select a default
hosting provider or cache backend.
