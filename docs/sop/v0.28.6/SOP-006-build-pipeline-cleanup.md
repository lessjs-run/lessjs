# SOP-006: v0.28.6 Declarative Build Pipeline Cleanup

> Version: v0.28.6
> Date: 2026-06-02
> Status: Completed
> ADR: ADR-0058 - BuildPipeline Declarative API
> Output: graph-driven release tasks, AST/manifest metadata boundaries,
> declaration-only generated entries, and diagnosable build failures.

## Summary

v0.28.6 is a build-pipeline architecture cleanup line. It should not add a new
user-facing framework feature. Its job is to make the current framework easier
to freeze before the v1.0 stabilization track.

The architectural target is simple:

> Generated code should only perform declarative connection. Complex logic must
> live in real TypeScript modules. Framework metadata must cross structured
> AST/manifest boundaries, not regex or source-text heuristics.

This applies to release orchestration, Hub generated data, island metadata, and
the generated SSR entry. The goal is not to eliminate all code generation. The
goal is to eliminate generated runtime logic and source-text parsing as
framework behavior boundaries.

## Core Decision

v0.28.6 adopts these rules as release-blocking architecture constraints.

### 1. Graph over hand-maintained lists

Workspace package order must come from package metadata and the package graph.
Root release tasks must not maintain their own package list.

Allowed:

```ts
await runWorkspaceTask({
  graph,
  task: 'publish:dry-run',
});
```

Not allowed:

```json
{
  "publish:dry-run": "deno publish packages/a && deno publish packages/b && ..."
}
```

The package graph is the source of truth. If package 20 is added, release and
typecheck coverage must update from metadata, not from a hand-edited root task.

### 2. AST or manifest over regex

Framework behavior must not depend on regex-parsed TypeScript source.

Allowed boundaries:

- a generated JSON manifest
- a generated typed module with a stable export shape
- a TypeScript or ESTree AST parser that accepts only static literals

Not allowed:

- regex body extraction for `export const less = { ... }`
- pairing generated objects by text position
- stripping comments and guessing semantics from source text

Regex can still be used for non-semantic diagnostics, snapshot normalization, or
test assertions. It must not decide framework behavior.

### 3. Runtime modules over generated runtime logic

Generated SSR entry files should declare imports, constants, and calls into real
modules. They should not embed adapter loading, AppShell selection, route
matching, metadata loading, or diagnostics as large string-generated blocks.

Allowed generated entry shape:

```ts
import { createSsrEntry } from '@lessjs/adapter-vite/ssr-runtime';
import './routes/index.tsx';
import './components/site-layout.tsx';

export default createSsrEntry({
  appShell,
  routes,
  islands,
});
```

Not allowed:

```ts
const code = `
  async function installAdapters() {
    // many branches of runtime behavior here
  }
`;
```

Some string generation is unavoidable because Vite virtual modules need source
text. That source text must be declaration-like glue, not the place where
runtime policy lives.

### 4. Strict failures over silent fallback

Missing optional generated data can be non-fatal. Present-but-broken generated
data is a build problem.

Allowed:

- `hub-data.ts` does not exist in a project that does not use Hub data
- dev server warns and continues when a missing optional file is expected

Not allowed:

- syntax/import/export/runtime failure in an existing generated file is treated
  as "not available"
- client-only Hub tags disappear silently from SSG admission
- adapter package import failures are hidden when the package exists but is
  internally broken

The build system must distinguish absent optional inputs from broken inputs.

### 5. Static metadata over executable metadata

Build-time metadata extraction must not execute browser-only island modules.

Allowed:

```ts
export const less = {
  ssr: false,
  dsd: false,
  hydrate: 'visible',
} as const;
```

Rejected:

```ts
export const less = getLessOptions();
export const less = { ...baseOptions };
export const less = { hydrate: `${mode}` };
```

Static-only metadata is less magical and more reliable. Unsupported dynamic
forms should fail with clear diagnostics instead of becoming best-effort
parsing.

## Scope

v0.28.6 covers five implementation areas:

1. package-graph driven root release tasks
2. Hub generated-data loading and failure semantics
3. island metadata AST or manifest extraction
4. generated SSR entry runtime-module extraction
5. consumer bundle boundary regression tests
6. verified pre-freeze cleanup defects from the 2026-06-03 audit

The work is cleanup-first. It may remove stale compatibility paths and source
heuristics. It should not expand the public API surface unless an existing
public behavior needs a clearer diagnostic.

## Entry Criteria

Before implementation starts:

1. `dev` contains the v0.28.5 consumer resolver patch.
2. `docs/status/STATUS.md` identifies the latest completed release line.
3. `deno task graph:check` reports the expected workspace package count.
4. `deno task publish:dry-run` passes or existing failures are documented.
5. The working tree contains no unrelated tracked edits.
6. Any untracked user notes are left untouched unless explicitly included.

## Workstream 1: Package-Graph Driven Release Tasks

### Problem

Root release tasks have been hand-maintained while the workspace package graph
has grown. That creates two truths:

- package graph order used by graph checks and remote publish workflows
- root task lists used by local typecheck and publish dry-run proof

Those paths must not drift.

### Target

Root tasks should call one graph runner. The graph runner should:

- read workspace package metadata
- topologically sort package publish order
- derive package-local typecheck or publish commands
- fail when a workspace package has no release metadata
- report the exact package count and ordered package names

### Required Shape

Keep public task names stable:

- `deno task typecheck`
- `deno task publish:dry-run`
- `deno task publish`

Replace the internals with graph-driven commands.

Preferred implementation:

```ts
await runPackageGraphCommand({
  command: 'publish:dry-run',
  mode: 'release',
});
```

### Acceptance

- root `deno.json` no longer contains a full 19-package publish chain
- package count reported by `graph:check` and `publish:dry-run` cannot disagree
- adding a package fixture in tests proves graph inclusion
- CI and local release proof use the same runner or shared graph module

## Workstream 2: Hub Generated-Data Failure Semantics

### Problem

Hub client-only discovery moved away from regex parsing, but generated-data
imports can still silently degrade. This is unsafe because SSG can admit
client-only components into SSR when generated Hub data exists but fails to load.

### Target

Introduce one shared helper for Hub client-only discovery.

The helper must distinguish:

- missing generated file
- valid generated file with no client-only tags
- valid generated file with client-only tags
- existing generated file with syntax/import/export/runtime failure

### Required Shape

Preferred helper:

```ts
const result = await loadHubClientOnlyTags({
  root,
  mode: 'build',
  diagnostics,
});
```

Expected result model:

```ts
type HubClientOnlyLoadResult =
  | { kind: 'missing'; path: string }
  | { kind: 'loaded'; path: string; tags: Set<string> }
  | { kind: 'broken'; path: string; error: unknown };
```

Build/CI mode must treat `broken` as a hard failure. Dev/watch mode may warn and
continue only when continuing preserves a usable development server.

### Affected Paths

- `packages/adapter-vite/src/less-plugin.ts`
- `packages/adapter-vite/src/cli/build-ssg.ts`

### Acceptance

- duplicated Hub discovery code is removed
- missing file is covered by tests
- empty valid data is covered by tests
- valid client-only tags are covered by tests
- present-but-broken generated data is covered by tests
- SSG cannot silently drop client-only tags because of import failure

## Workstream 3: Island Metadata AST or Manifest Extraction

### Problem

`scanIslandMeta()` still uses source-text parsing for `export const less`.
Comment stripping and regex extraction are not an acceptable framework metadata
boundary.

### Target

Replace regex metadata extraction with either:

1. TypeScript/ESTree AST extraction, or
2. a generated metadata manifest consumed by the scanner.

AST extraction is the preferred first step because it is local, explicit, and
does not require executing island modules.

### Static Contract

Accepted:

```ts
export const less = {
  ssr: false,
  dsd: false,
  hydrate: 'idle',
} as const;
```

Also accepted:

- comments
- trailing commas
- single or double quoted string literals
- `as const`
- line breaks and normal formatting variation

Rejected:

- spreads
- computed keys
- imported constants
- function calls
- template expressions
- conditional expressions
- reassigned metadata

### Diagnostic Contract

Unsupported metadata must produce a clear message:

- file path
- export name
- unsupported syntax kind
- accepted static shape

It must not silently fall back to default island behavior when an explicit
unsupported `less` export exists.

### Acceptance

- no regex parses `export const less` object bodies
- browser-only top-level module code is not executed
- supported static cases pass
- unsupported dynamic cases fail with diagnostics
- route scanner tests cover the accepted and rejected shapes

## Workstream 4: Generated SSR Entry Runtime-Module Extraction

### Problem

The generated SSR entry still contains too much runtime behavior as string-built
source. This makes the code harder to test and easier to regress because the
logic is reviewed through generated strings rather than real modules.

### Target

Move complex runtime behavior into real TypeScript modules.

Generated entry source should be limited to:

- imports for route modules, layout modules, and island modules
- serializable route and AppShell descriptors
- a call into a stable SSR runtime helper

Runtime modules should own:

- optional adapter installation
- adapter failure diagnostics
- AppShell layout selection
- route matching helpers
- render entry orchestration
- metadata normalization

### Required Shape

Generated entry should move toward:

```ts
import { createSsrEntry } from '@lessjs/adapter-vite/ssr-runtime';

export default createSsrEntry({
  adapters,
  appShell,
  routes,
  islands,
  diagnostics,
});
```

The exact object shape may differ, but the boundary must remain declarative.

### Acceptance

- generated source contains materially less branch-heavy runtime code
- helper behavior is tested in real TypeScript tests
- generated-code tests assert declarations and wiring only
- AppShell modes from v0.28.4 remain covered
- optional adapter failure semantics remain visible
- no new `globalThis` bridge or hidden global state is introduced

## Workstream 5: Consumer Bundle Boundary Regression Tests

### Problem

v0.28.5 fixed a concrete consumer failure where a generated SSR bundle leaked a
framework-owned bare npm import. v0.28.6 must turn that fix into a recurring
release proof.

### Target

Consumer bundle tests must prove that a fresh generated project can build
without relying on the LessJS repository import map.

The test should catch:

- root import-map-only aliases leaking into generated bundles
- framework-owned npm dependencies emitted as unresolved bare externals
- server-only dependencies entering browser bundles
- consumer SSG builds that pass locally only because the workspace masks them

### Acceptance

- consumer smoke or build-output tests check the generated SSR bundle boundary
- known forbidden specifiers are asserted absent
- generated project build remains part of CI release proof
- docs or release notes explain why consumer bundle checks are release gates

## Workstream 6: Verified Pre-Freeze Defect Cleanup

### Problem

The 2026-06-03 audit found several concrete defects that are not new features
and should not wait for the v0.29 UI Shell work. They are small, but they affect
API semantics, build consistency, or package dependency boundaries.

### Required Fixes

1. Fix adapter registry reset semantics.
   - Current issue: `register(undefined)` clears all named adapters.
   - Target: resetting the default adapter must not silently wipe named
     adapters unless the explicit operation is `clear()`.
   - Affected file: `packages/core/src/adapter-registry.ts`.

2. Collapse optional package stubs into one real module.
   - Current issue: SSG and dev/plugin paths can use different stub sets.
   - Target: `packages/adapter-vite/src/optional-package-stubs.ts` is the only
     source of optional stub definitions.
   - Affected files:
     - `packages/adapter-vite/src/less-plugin.ts`
     - `packages/adapter-vite/src/cli/build-ssg.ts`

3. Restore the `@lessjs/core` dependency and trust-boundary model.
   - Current issue: `packages/core/src/security.ts` imports
     `npm:sanitize-html`.
   - Target: core must not own a heavy npm sanitizer dependency. `rawHtml`
     must be documented or renamed as a trusted HTML boundary, and untrusted
     HTML must be sanitized before entering core.
   - Affected file: `packages/core/src/security.ts`.
   - Follow-up: the full structured trust model is deferred to
     [ADR-0077](../../adr/ADR-0077-structured-render-ir.md) and v0.29.0.

4. Fold package version synchronization into the package graph/release runner.
   - Current issue: package version bumps are duplicated across package
     metadata.
   - Target: version bump validation and/or update should be graph-driven.

5. Remove small review-quality drift while touching the build path.
   - Example: duplicate `entities` in `ssrExternalDefaults`.

### Acceptance

- adapter registry tests cover default reset versus full clear
- SSG and dev builds import the same optional stub module
- core publish metadata no longer hides an unintended npm dependency boundary
- raw/trusted HTML semantics no longer overclaim sanitizer behavior
- package version consistency is covered by the graph/release runner
- duplicate external defaults are removed
- these fixes are described in the v0.28.6 changelog and release note

## Execution Order

1. Write the v0.28.6 ADR before code changes.
2. Implement the package graph runner and update root release tasks.
3. Add package-graph tests proving package-count agreement.
4. Add shared Hub generated-data loader and remove duplicated discovery code.
5. Replace island metadata regex parsing with AST or manifest extraction.
6. Extract SSR entry runtime behavior into real modules.
7. Add consumer bundle boundary regression tests.
8. Fix the verified pre-freeze defects from Workstream 6.
9. Run focused tests for each changed subsystem.
10. Run full local gates.
11. Update changelog, release note, and package versions to `0.28.6`.
12. Push `dev`, monitor CI, merge to `main`, and verify publish workflow.

## Verification

Focused gates:

- package graph runner tests
- Hub generated-data loader tests
- route scanner island metadata parser tests
- SSR runtime helper tests
- generated entry wiring tests
- consumer bundle boundary smoke test
- adapter registry tests
- optional package stub consistency tests
- core dependency-boundary check
- raw/trusted HTML trust-boundary tests

Full local gates:

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
- `main`: Publish to JSR with post-publish consumer smoke

## Exit Criteria

v0.28.6 is complete only when:

- root release tasks are package-graph driven
- package count cannot drift between graph check and release dry-run
- Hub generated-data failures are diagnosable and tested
- island `less` metadata no longer uses regex body parsing
- generated SSR entry code is declaration-heavy and runtime-light
- complex SSR behavior lives in real tested modules
- consumer bundle boundary regressions are tested
- adapter registry default reset does not wipe named adapters
- optional package stubs are single-source
- core dependency boundary is explicit and tested
- sanitizer removal does not broaden the default escaped `innerHTML` behavior
- all 19 packages are bumped to `0.28.6`
- changelog and release note describe this cleanup line accurately
- full local gates pass
- `dev` CI is green
- `main` publish workflow succeeds

## Explicit Non-Goals

- No new AppShell public API.
- No Markdown to MDX migration.
- No router rewrite.
- No desktop/chat application layer.
- No compatibility restoration for removed APIs.
- No broad UI redesign.
- No package split beyond what the graph already models.
- No dynamic metadata execution.
- No best-effort regex fallback for framework behavior.

## Reviewer Checklist

Use this checklist during review:

- Does any root release task still encode package order manually?
- Does any framework behavior still depend on regex-parsed TypeScript source?
- Does generated SSR code contain runtime policy that could live in a module?
- Can a present-but-broken generated data file fail silently?
- Can browser-only island code execute during metadata extraction?
- Can a fresh consumer build pass only because the LessJS repo import map exists?
- Are unsupported static metadata forms rejected clearly instead of guessed?
- Are generated-code tests checking wiring instead of re-testing runtime logic
  through strings?
