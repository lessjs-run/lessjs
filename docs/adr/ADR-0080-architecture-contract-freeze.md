# ADR-0080: Architecture Contract Freeze

- Status: Accepted
- Date: 2026-06-04
- Target: v0.30.0
- Supersedes: unproved completion claims in ADR-0079
- Related: ADR-0077, ADR-0078, ADR-0079

## Context

LessJS has reached the end of the v0.29.x cleanup arc, but the current repository
still contains mismatches between the stated architecture and the code that users
actually consume:

- the public render contract still exposes string-returning components in some
  types, examples, and SSR compatibility paths
- the renderer is structurally improved, but old escape hatches still keep a
  second behavioral path alive
- metadata and generated-data boundaries are cleaner than before, but not all
  source-of-truth rules are enforced by gates
- duplicate logic still exists across packages, especially for compatibility
  classifications, Hub CLI record loading, snapshot placeholders, and adapter
  hydration helpers
- some completed SOP and ADR text is stronger than the implementation evidence
  available in the repository

The project policy for this release line is explicit: LessJS does not need to
preserve backward compatibility before the API freeze. A compatibility shim that
keeps old architecture alive is worse than a breaking cleanup that makes the
future contract obvious.

This ADR is based on a tracked-file byte-read baseline, not on a sampled grep.
On 2026-06-04, `git -c core.quotepath=false ls-files -z` produced 952 tracked
files. All 12,476,393 bytes were read successfully with zero read failures before
the architecture scan was classified.

The initial scan found:

| Pattern family                                    | Count |
| ------------------------------------------------- | ----: |
| current or historical string render contract text |   146 |
| core string-render branch text                    |    11 |
| `wrongTypeErrorHtml` text                         |     9 |
| raw/trusted HTML names                            |    65 |
| source-regex boundary text                        |    63 |
| compatibility type definitions                    |     4 |
| `loadRecords` helpers                             |     3 |
| `renderPlaceholder` helpers                       |     3 |
| internal `jsr:@lessjs/*` specifiers               |   287 |
| `as any`                                          |   194 |
| `as unknown as`                                   |   172 |
| TypeScript suppressions                           |     7 |
| TODO/FIXME                                        |   274 |

The counts include historical documents, tests, generated data, and fixtures.
They are not automatically all defects. v0.30.0 must classify each family,
delete current-contract debt, and gate any remaining intentional exceptions.

## Decision

v0.30.0 is the architecture contract freeze. It is not a UI expansion release.
It must close the current cleanup arc by forcing one contract, one renderer
pipeline, one metadata source of truth, one copy of each shared concept, and
proof gates for every completed claim.

### 1. One Public Contract

The public component render contract is:

```ts
render(): VNode | null;
```

Core must not accept string-rendering as a public component contract. If an
adapter wants to support strings, React elements, Lit templates, or another
framework object, it must convert at the adapter boundary before entering the
core DSD renderer.

Required consequences:

- `DsdElement.render()` returns `VNode | null`
- `DsdComponent.render()` returns `VNode | null`
- `RenderInput`, hooks, tests, examples, and current docs use `VNode | null`
- core removes the deprecated string branch and old string error helpers
- current docs do not teach `render(): string`
- old ADRs may remain historical, but current architecture docs must describe
  the current contract only

### 2. One Renderer Pipeline

All core rendering flows must pass through a single renderer model:

```text
VNode -> RenderNode IR -> serializer -> HTML or DOM boundary
```

The renderer must not maintain parallel string-specific, template-specific, or
legacy fallback serialization paths. Trusted HTML remains an explicit IR node and
an explicit trust boundary. It is not a sanitizer.

Required consequences:

- DSD wrapping is represented in RenderNode IR
- attribute serialization has one implementation
- event marker serialization has one implementation
- DOM rendering and string rendering share the same structural semantics
- compatibility conversion happens before core render entry, not inside the
  renderer hot path

### 3. One Metadata Source of Truth

Generated code may only connect typed declarations. It must not own business
logic and must not be parsed by regex.

Required consequences:

- route metadata extraction uses AST or manifest data
- Hub generated data is imported or read as structured data
- generated SSR entries contain declarative wiring only
- package graph and release order are computed from package metadata
- internal package version ranges are checked by the graph gate
- optional dependency failures distinguish missing optional packages from broken
  installed packages

### 4. One Copy of Shared Logic

Any shared concept used by more than one package gets one canonical owner.

Initial canonical owners:

| Concept                             | Canonical owner                                                      |
| ----------------------------------- | -------------------------------------------------------------------- |
| `CompatibilityClassification`       | `@lessjs/protocols` or `@lessjs/core/types`, but not both            |
| HTML and attribute escaping         | `@lessjs/core`                                                       |
| Hub package record loading          | `packages/hub/src/cli/shared.ts`                                     |
| Hub snapshot placeholder rendering  | `packages/hub/src/snapshot-placeholder.ts`                           |
| adapter DSD hydration event binding | one shared helper in `@lessjs/core` or `@lessjs/runtime`             |
| package graph task execution        | `tools/run-package-graph-task.ts`                                    |
| generated data loading              | `packages/adapter-vite/src/generated-data-resolver.ts` style helpers |

Duplicate local definitions are not allowed unless the duplicate is test-only
fixture data.

### 5. Completed Means Gate-Proved

An SOP, ADR, changelog, or release note may say "Completed" only if the repo has
a repeatable command that proves the claim.

The architecture gate for v0.30.0 must check at least:

- tracked-file byte-read inventory succeeds with zero read failures
- no current docs or examples use `render(): string`
- core has no `wrongTypeErrorHtml`
- core render path has no `typeof result === 'string'` component branch
- production `as any` count is zero
- production `as unknown as` is either zero or listed in a reviewed allowlist
  with a specific reason
- production TypeScript suppressions are zero or explicitly allowlisted
- production TODO/FIXME entries are classified or removed
- shared interfaces are declared in one canonical package
- duplicate helper functions listed in this ADR no longer exist
- internal `jsr:@lessjs/*` ranges match the release line
- generated-data boundaries do not regex-parse TypeScript source
- all completed current SOPs have matching verification commands

## Non-Goals

- No UI Shell, Ocean-Island, daisyUI, or `@lessjs/ui/css` expansion in v0.30.0
- No new adapter feature work
- No new Hub product surface
- No new public API except the removal or tightening required by the contract
- No compatibility migration layer for removed pre-freeze APIs

## Consequences

### Positive

- LessJS gets a coherent API before the next product-facing expansion
- renderer behavior becomes easier to reason about and test
- package publication becomes less dependent on hand-maintained release lists
- docs stop overstating what the code proves
- future UI Shell work can build on a stable core instead of carrying old
  renderer and metadata debt

### Negative

- users returning strings from `render()` must migrate to VNode output
- some tests and examples must be rewritten instead of patched around
- old SOP claims may need to be downgraded or corrected if they are historical
  but not currently gate-proved

### Neutral

- adapter packages may continue to accept framework-native render values, but
  only at their boundary
- historical ADRs remain as historical context and are not rewritten unless they
  are part of current documentation

## Exit Rule

v0.30.0 local completion is proven by the full local gate. Remote completion is
proven by the `dev` and `main` CI runs for the pushed release commit:

```powershell
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
```
