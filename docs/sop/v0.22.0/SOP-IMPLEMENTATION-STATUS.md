# v0.22.0 SOP Implementation Status

> **Date**: 2026-05-26
> **Version**: 0.22.0

## SOP-001: Consumer Surface Cleanup ✅

Generated projects: 18→4 imports.
- `@deno/vite-plugin` + `@lessjs/app` + `@lessjs/core` + `@lessjs/ui`
- parse5/entities/hono handled by ADR-0047 pre-resolution (external-resolver.ts)
- `packages/create/cli.ts` template updated
- `packages/create/__tests__/cli.test.ts` updated

## SOP-002: Package Boundary Repair ✅

- `build-types.ts` + `virtual-ids.ts`: core → adapter-vite
- StyleSheet canonical: `@lessjs/style-sheet`, core re-exports
- UI `_esc`/`_escAttr`: extracted to `packages/ui/src/shared/escape.ts`
- Hub scanner `records.push(null!)`: replaced with typed pre-allocation

## SOP-003: adapter-vite Decomposition ✅

`index.ts`: 841→62 lines. 5 new modules:
- `less-plugin.ts` — Vite plugin assembly + phase orchestration
- `head-injection.ts` — HTML head fragment validation + serialization
- `subpath-resolver.ts` — JSR resolution + virtual module dispatch
- `optional-package-stubs.ts` — adapter stubs (lit/vanilla/react)
- `phase-context.ts` — build context wiring

## SOP-004: Signals Facade + Engine ✅

- SignalEngine interface defined in `@lessjs/core/signals`
- **TC39 polyfill removed** (`polyfill.ts` deleted, -413 lines)
- **alien-signals sole engine** — sync, no fallback
- **Sugar layer removed** (`sugar.ts` deleted, -188 lines)
  - islandEffect/channel/themeSignal/batch/untracked/isNativeSignal
  - Channel/ChannelHandler types, 4 test files
- framework.ts: 139→20 lines (pure engine bind)
- `@lessjs/signals`: 903→319 lines (-65%)

## SOP-005: Quality Gates ⏳

Deferred to v0.22.1:
- CI coverage artifact
- Playwright trace retention
- lint.yml / sop-gate.yml dedup

## Additional Changes

- **Signals version**: 0.22.0 (not published to JSR yet)
- **FALLBACK_LESSJS_VERSION**: 0.22.0
- **alien-signals**: `npm:alien-signals@^3.2.0` as workspace dependency
- **CHANGELOG**: `docs/changelog/v0.22.x.md` created
