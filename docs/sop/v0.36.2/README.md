# v0.36.2 SOP: SSG Bridge Migration and Rendering Evidence Closure

> Status: Active\
> Roadmap: SSG Bridge Migration + Rendering Evidence Closure\
> NextVersion: `docs/next/v0.36.2/`

## Goal

Reduce v0.37 scope risk by moving the Vite-free SSG core into
`@openelement/ssg` now. Keep adapter-vite as the orchestration shell for Vite
SSR bundle construction and plugin coordination.

This is a bridge migration, not the complete adapter-vite file ownership
migration and not a Server/Data/UI/starter/Hub product release.

## Tasks

- [x] Move `ssgRender()` into `packages/ssg/src/ssg-render.ts`.
- [x] Move SSG render types into `@openelement/ssg`.
- [x] Move HTML postprocess helpers into `packages/ssg/src/postprocess.ts`.
- [x] Export SSG render and postprocess APIs from `packages/ssg/src/index.ts`.
- [x] Keep `renderSequential()` and `renderParallel()` public and tested.
- [x] Replace adapter-vite postprocess implementation with compatibility re-exports.
- [x] Replace adapter-vite SSG render implementation with a compatibility wrapper.
- [x] Delegate build-time SSG execution from `build-ssg.ts` to `@openelement/ssg`.
- [x] Pass build evidence through plain `SsgRenderEvidence` options.
- [x] Add `packages/ssg` render and postprocess tests.
- [x] Add adapter bridge tests for compatibility exports.
- [x] Add FileIsrCache file-system persistence test.
- [x] Use `createIsrCacheKey()` for ISR manifest entries.
- [x] Add Streaming DSD `new Response(stream)` consumption test.
- [x] Record v0.36.2 AutoFlow metrics with one merged low-risk cell.
- [x] Update release truth docs for v0.36.2 current scope and v0.37 deferrals.

## Verification

Required release gates:

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task graph:check
deno task autoflow:test
deno task autoflow:health
deno task autoflow:check
deno task test
deno task build
deno task dsd:check-report
deno task publish:dry-run
deno task test:e2e
```

Focused bridge evidence already covers:

```bash
deno test --allow-read --allow-write --allow-env --allow-net --allow-run packages/ssg/__tests__/ packages/core/__tests__/isr.test.ts packages/core/__tests__/streaming-dsd.test.ts packages/adapter-vite/__tests__/ssg-bridge.test.ts packages/adapter-vite/__tests__/ssg-render.test.ts
```

## Non-Goals

- Do not move Vite SSR bundle build logic out of `adapter-vite`.
- Do not move route scanner, entry generator, Vite plugin, or generated data resolver.
- Do not start Server/Data/UI/starter/Hub product closure.
- Do not make AutoFlow tag, publish, or merge release branches automatically.
- Do not claim Firefox/WebKit expansion unless the actual browser gate proves it.

## Exit Criteria

- `@openelement/ssg` is no longer a skeleton; it owns Vite-free SSG render and postprocess code.
- `adapter-vite` delegates SSG rendering to `@openelement/ssg`.
- Root build still emits static HTML, client bundle, DSD report, sitemap/PWA assets, and ISR manifest.
- `autoflow:health` and `autoflow:check` agree with the current v0.36.2 status.
- Full release gate status is recorded before tag or publish.

## Related

- [ADR-0086: AI-Readable Architecture and AutoFlow Roadmap](../../adr/ADR-0086-ai-readable-architecture-and-autoflow2-roadmap.md)
