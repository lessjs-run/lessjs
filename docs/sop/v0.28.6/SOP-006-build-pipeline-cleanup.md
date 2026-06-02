# SOP-006: v0.28.6 Build Pipeline + Metadata Boundary Cleanup

> Version: v0.28.6
> Date: 2026-06-02
> Status: Planned
> ADR: TBD - Build Pipeline Metadata Boundary
> Output: package-graph driven release tasks, structured metadata extraction,
> diagnosable generated-data failures, and reduced generated-code complexity.

## Summary

v0.28.6 is the final architecture-cleanliness pass before the v1.0 stabilization
track. v0.28.4 and v0.28.5 made the release line coherent, consumer-safe, and
usable. The remaining work is narrower: remove the build-layer patterns that are
still correct but not clean enough to freeze.

The focus is `@lessjs/adapter-vite` and release orchestration:

- release tasks must be driven by the package graph, not hand-maintained lists
- generated Hub metadata must fail diagnostically when present-but-broken
- island metadata must stop depending on source-text regex parsing
- generated SSR entry code should move toward smaller typed helpers instead of
  large string-built runtime blocks
- consumer bundle checks must guard the actual published-runtime boundary

This SOP is intentionally cleanup-first. It should not introduce new public
framework features.

## Entry Criteria

Before implementation starts:

1. `main` and `dev` must both contain the v0.28.5 consumer resolver patch.
2. `docs/status/STATUS.md` must identify v0.28.5 as the last completed line.
3. `deno task graph:check` must report 19 packages and 19 publish steps.
4. `deno task publish:dry-run` must pass from a clean committed tree.
5. The only accepted dirty files are explicitly user-owned untracked notes.

## Goals

### 1. Package-Graph Driven Release Tasks

Replace root hand-maintained release lists with graph-derived execution.

Current acceptable state:

- root `publish`, `publish:dry-run`, and `typecheck` cover all 19 packages

Target v0.28.6 state:

- root tasks call small tools that read package metadata and package graph order
- adding package 20 should require package-local metadata only
- `graph:check` and release tasks must share one package-order source
- CI and local release proof must use the same task paths

Expected implementation shape:

- add or extend a `tools/*package-graph*.ts` runner
- generate `deno check` inputs from package exports and explicit app entries
- generate publish order from the existing graph topological sort
- keep user-facing task names stable:
  - `deno task typecheck`
  - `deno task publish`
  - `deno task publish:dry-run`

Acceptance:

- root task definitions no longer contain the full 19-package publish chain
- a package-graph unit test proves all workspace packages are included
- `graph:check` and `publish:dry-run` cannot disagree on package count

### 2. Generated Hub Metadata Failure Semantics

The Hub client-only discovery path now imports structured `hub-data.ts`, which
is the correct boundary. v0.28.6 must finish the failure model.

Target behavior:

- missing `app/data/registry/hub-data.ts`: non-fatal debug or info message
- existing file with syntax/import/export/runtime failure: warning or build
  failure, depending on mode
- SSG release/build gates must not silently drop client-only Hub tags

Affected paths:

- `packages/adapter-vite/src/less-plugin.ts`
- `packages/adapter-vite/src/cli/build-ssg.ts`

Expected implementation shape:

- add a shared `loadHubClientOnlyTags()` helper
- check file existence before dynamic import
- include file path and failure reason in diagnostics
- in CI/build mode, treat present-but-broken generated data as a hard error
- in dev/watch mode, warn and continue only when that keeps the server usable

Acceptance:

- tests cover missing file, empty data, valid client-only tags, and broken file
- broken generated Hub data cannot make SSG silently admit client-only tags
- duplicated Hub discovery code is removed from dev and SSG paths

### 3. Structured Island Metadata Extraction

`scanIslandMeta()` still extracts `export const less = { ... }` through
comment-stripped regex. It works for current fixtures, but it is still source
format parsing in a framework build boundary.

Target behavior:

- parse island metadata through a structured mechanism
- support the current static form:

```ts
export const less = {
  ssr: false,
  dsd: false,
  hydrate: 'idle',
} as const;
```

- preserve the no-module-execution property for browser-only island files

Preferred implementation options:

1. use a lightweight TypeScript/ESTree parser to extract a literal object
2. generate a metadata manifest earlier in the pipeline and consume that
3. keep a source fallback only behind an explicit diagnostic and test gate

Acceptance:

- no regex parses `export const less` object bodies
- comments, trailing commas, `as const`, line breaks, and string quotes are
  covered
- computed keys/spread/template values are rejected with a clear diagnostic
- browser-only top-level code is not executed during metadata extraction

### 4. Generated SSR Entry Code Boundary

`entry-renderer.ts` still owns a large amount of string-generated runtime code.
Some string generation is unavoidable because Vite consumes a virtual module,
but runtime behavior should be moved into typed helpers where possible.

Target behavior:

- generated entry code should mostly wire imports and data
- adapter installation, shell selection, route matching helpers, and diagnostics
  should live in real TypeScript helper modules where possible
- generated code snapshots should be smaller and easier to review

Expected implementation shape:

- extract optional adapter installation helper
- extract AppShell layout selection helper if it can avoid runtime coupling
- keep `renderEntry()` deterministic and side-effect free
- add tests around helper behavior instead of only testing generated strings

Acceptance:

- generated entry string size and branch complexity are reduced
- adapter failure behavior remains diagnosable
- AppShell modes from v0.28.4 still pass
- no new global state or `globalThis` bridge is introduced

### 5. Consumer Bundle Boundary Regression Tests

v0.28.5 fixed the concrete consumer-smoke failure where the SSR bundle leaked a
bare `sanitize-html` import. v0.28.6 should generalize the proof.

Target behavior:

- generated server bundle must not depend on root import-map-only bare aliases
- framework-owned npm dependencies emitted into server bundles must be
  Deno-resolvable for fresh JSR consumers
- local workspace import maps must not mask consumer failures

Acceptance:

- build-output or smoke tests assert the server bundle does not leak known
  framework-owned bare externals
- consumer generated-project build remains part of CI publish workflow
- docs explain why server bundle external specifiers are part of release proof

## Execution Order

1. Write the v0.28.6 ADR before code changes.
2. Implement package-graph driven task runners.
3. Replace duplicated Hub client-only discovery with one helper and strict
   failure semantics.
4. Replace island metadata regex parsing with structured extraction.
5. Extract generated-entry runtime helpers where the code boundary is clear.
6. Add consumer-bundle regression tests.
7. Run full local gates.
8. Update changelog/release docs and bump all packages to `0.28.6`.
9. Push `dev`, wait for CI, fast-forward `main`, and verify publish workflow.

## Verification

Minimum focused gates:

- package graph runner tests
- adapter-vite Hub metadata tests
- adapter-vite island metadata parser tests
- entry renderer/helper tests
- SSG smoke test
- generated consumer project build test

Full release gates:

- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno audit`
- `deno task graph:check`
- `deno task graph:check-imports`
- `deno task docs:check-strategy`
- `deno task docs:check-current`
- `deno task build`
- `deno task dist:check-object-object`
- `deno task dsd:check-report`
- `deno task test`
- `LESSJS_E2E_PORT=4175 CI=1 deno task test:e2e`
- `deno task publish:dry-run`

Remote gates:

- `dev`: Lint & Format, Test, SOP Gate, CodeQL
- `main`: Lint & Format, Test, SOP Gate, CodeQL, Code Quality
- `main`: Publish to JSR, including post-publish consumer smoke

## Exit Criteria

v0.28.6 is complete only when:

- root release tasks are graph-driven
- Hub generated-data failures are diagnosable and tested
- island `less` metadata no longer uses regex body parsing
- generated SSR entry runtime code is reduced or justified by tests
- all 19 packages are bumped to `0.28.6`
- changelog and release note describe the cleanup line accurately
- local full gates pass
- `dev` CI is green
- `main` publish workflow succeeds, including consumer smoke

## Non-Goals

- No new AppShell public API.
- No Markdown to MDX migration.
- No router rewrite.
- No desktop/chat application layer.
- No compatibility restoration for removed APIs.
- No broad UI redesign.
- No package split beyond what the package graph already models.
