# v0.31.0 SOP: JSX-first Application API

> Version: v0.31.0\
> Date: 2026-06-05\
> Status: Complete\
> ADR: ADR-0082

## Goal

Make openElement feel like an application framework, not only a renderer runtime.

The default tutorial API must become:

```tsx
import { definePage } from '@openelement/app';

export default definePage(() => {
  return <main>Hello openElement</main>;
});
```

`DsdElement` remains the runtime primitive, but it is no longer the first thing a
new app author sees.

## Entry Criteria

- v0.30.1 architecture cleanup is complete.
- Renderer contract remains JSX -> VNode -> RenderNode -> DSD HTML or DOM.
- No string renderer revival.
- No backward compatibility requirement for `openElement()` root import.

## Tasks

### 1. Authoring API

- [x] Add `packages/app/src/authoring.ts`.
- [x] Export `definePage()`.
- [x] Export `defineElement()`.
- [x] Export `defineLayout()`.
- [x] Export `defineIsland()`.
- [x] Keep root `@openelement/app` free of Vite/build imports.
- [x] Move Vite facade to `@openelement/app/vite`.

### 2. Page Descriptor

- [x] Support function shorthand.
- [x] Support object form with `title`, `description`, `head`, `layout`,
      `styles`, `rendering`, `streaming`, `revalidate`, `load`, and `render`.
- [x] Store structured metadata on `default.openElementPage`.
- [x] Keep route data/request/params on internal `__openElement*` props.
- [x] Filter internal props out of DSD host attributes and `data-ssr-props`.

### 3. Adapter Integration

- [x] SSR route handler reads `default.openElementPage`.
- [x] SSR route handler calls `load()` before render.
- [x] SSG `renderRoute()` calls `load()` before render.
- [x] AppShell route metadata sees page title, description, and layout.
- [x] Route revalidation sees page descriptor `revalidate`.
- [x] Tests lock generated wiring.

### 4. Create Template

- [x] Generated `vite.config.ts` imports `openElement()` from
      `@openelement/app/vite`.
- [x] Generated `deno.json` maps both `@openelement/app` and
      `@openelement/app/vite`.
- [x] Generated page uses `definePage()`.
- [x] Generated island uses `defineIsland()`.
- [x] Generated project build test passes.

### 5. Docs and Website

- [x] README and README.zh teach `definePage()` first.
- [x] `packages/app/README.md` documents the root/subpath split.
- [x] Current architecture doc reflects the new layering.
- [x] www guide pages teach Application API first.
- [x] Package READMEs and source comments stop teaching the old build import.

### 6. Release

- [x] Bump all 19 packages to `0.31.0`.
- [x] Update changelog and release note.
- [x] Run full local gates.
- [x] Push `dev`.
- [x] Wait for `dev` CI.
- [x] Merge to `main`.
- [x] Wait for `main` CI.
- [x] Tag `v0.31.0` and publish GitHub release notes.

## Verification

Local gates passed on 2026-06-05:

```bash
deno task arch:check
deno task graph:check
deno task docs:check-current
deno task docs:check-strategy
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
deno task publish:dry-run
deno task test:e2e
```

Observed local results:

- `arch:check`: tracked-file architecture contract passed.
- `graph:check`: 19 packages, unified `0.31.0`, no cycles, passed.
- `docs:check-current` and `docs:check-strategy`: passed.
- `fmt:check`, `lint`, and `typecheck`: passed.
- `test`: 1302 tests passed, 0 failed.
- `build`: 33 routes, 363 HTML files, DSD report 0 errors.
- `dsd:check-report`: total errors 0.
- `consumer:local`: generated app built successfully.
- `publish:dry-run`: all 19 packages passed.
- `test:e2e`: 101 Chromium tests passed.

Additional targeted proof:

```bash
deno test packages/app/__tests__/authoring.test.tsx packages/adapter-vite/__tests__/entry-renderer.test.ts --allow-read --allow-write --allow-env --allow-net --allow-run
deno test packages/create/__tests__/cli.test.ts --allow-read --allow-write --allow-env --allow-net --allow-run
```

## Non-Goals

- No built-in ORM.
- No auth platform.
- No UI Shell redesign.
- No renderer contract changes.
- No string render revival.
- No compatibility shim for root `openElement()` import.

## Exit Criteria

- Current docs, starter, and package READMEs show Application API first.
- Generated projects build locally.
- Full gates pass.
- CI passes on `dev` and `main`.
- Git tag and GitHub release note exist.
