# LessJS v0.30.0 SOP: Architecture Contract Freeze

> Version: v0.30.0
> Date: 2026-06-04
> Status: Done
> ADR: ADR-0080
> Release type: Breaking architecture cleanup

## Mission

Finish the architecture cleanup arc in one release. v0.30.0 must leave LessJS
with:

- one public component contract
- one renderer pipeline
- one metadata source-of-truth model
- one canonical copy of shared logic
- completed SOP claims that are proven by code and gates

Backward compatibility is not a goal. Any compatibility path that keeps an old
architecture alive must be removed unless it is required by a platform standard
or by an adapter boundary outside core.

## Entry Criteria

- Current branch is `dev`.
- Working tree is clean except explicitly ignored local artifacts.
- `main` and `dev` are understood before edits begin.
- Latest package versions, SOPs, ADRs, changelogs, and release notes have been
  read from the checkout.
- Current local baseline is captured:

```powershell
git status --short --branch
git log --oneline --decorate -12
deno task graph:check
deno task docs:check-current
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
```

## Byte-Read Baseline

The first step of v0.30.0 is not a grep-only audit. The repository must be read
as bytes from the tracked-file set so that binary files, generated data, and
non-ASCII paths cannot be skipped by shell quoting.

Baseline command:

```powershell
$raw = git -c core.quotepath=false ls-files -z
$files = $raw -split "`0" | Where-Object { $_ -ne "" }
$totalBytes = 0L
$sha256 = [System.Security.Cryptography.SHA256]::Create()
foreach ($p in $files) {
  $bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path $p))
  $totalBytes += $bytes.LongLength
  $null = $sha256.ComputeHash($bytes)
}
```

Baseline captured on 2026-06-04:

| Metric        | Value      |
| ------------- | ---------- |
| tracked files | 952        |
| bytes read    | 12,476,393 |
| read failures | 0          |

Initial architecture scan counts from that byte-read baseline:

| Pattern family                | Count |
| ----------------------------- | ----: |
| `render(): string` contract   |   146 |
| core string-render branch     |    11 |
| `wrongTypeErrorHtml`          |     9 |
| raw/trusted HTML names        |    65 |
| source-regex boundary         |    63 |
| duplicate compatibility type  |     4 |
| duplicate `loadRecords`       |     3 |
| duplicate `renderPlaceholder` |     3 |
| internal `jsr:@lessjs/*`      |   287 |
| `as any`                      |   194 |
| `as unknown as`               |   172 |
| TS suppressions               |     7 |
| TODO/FIXME                    |   274 |

These counts are not all bugs. Historical docs, tests, generated data, and
fixture code are allowed to contain old text where explicitly classified. The
v0.30.0 requirement is that every remaining hit is either removed, moved to a
historical-only bucket, or allowlisted with a reason and checked by
`arch:check`.

## Workstreams

### W0: Byte-Level Repository Inventory

Goal: know the real cleanup surface before editing.

Tasks:

- [x] Inventory all tracked source and docs files with `git ls-files`.
- [x] Use NUL-delimited paths with `core.quotepath=false`.
- [x] Read every tracked file as bytes and write a SHA-256 manifest.
- [x] Exclude ignored/generated output from manual edits.
- [x] Produce a cleanup inventory for:
  - public render contract references
  - renderer entrypoints and serializers
  - metadata/generated-data boundaries
  - duplicated helpers and duplicated types
  - production type escapes
  - package version ranges
  - completed SOP and ADR claims
- [x] Record the exact files that must change before implementation starts.

Exit:

- [x] No cleanup target is based on memory or stale previous-run claims.
- [x] Every planned deletion or merge has a file path and owner.
- [x] The byte-read manifest has 0 read failures.
- [x] Architecture scan counts are committed into the release evidence.

### W1: One Public Contract

Goal: make `render(): VNode | null` the only core component contract.

Tasks:

- [x] Update `DsdComponent.render()` to `VNode | null`.
- [x] Ensure `DsdElement.render()` remains `VNode | null`.
- [x] Remove core string render compatibility from `render-dsd.ts`.
- [x] Delete `wrongTypeErrorHtml`.
- [x] Remove old comments saying `render(): string`, `string | VNode`, or
      `string | TemplateResult` from current source docs.
- [x] Rewrite current guide examples to return JSX/VNode.
- [x] Keep historical ADRs historical, but make current architecture docs
      describe only the current contract.
- [x] Add a gate that fails on current-doc `render(): string` examples.
- [x] Clean current contract hits in:
  - `docs/arch/current-architecture.md`
  - `packages/adapter-lit/src/index.ts`
  - `packages/adapter-react/src/index.ts`
  - `packages/adapter-vanilla/README.md`
  - `packages/adapter-vanilla/src/dsd-hydration.ts`
  - `packages/adapter-vite/src/entry-descriptor.ts`
  - `packages/core/src/dsd-element.ts`
  - `packages/core/src/types.ts`
  - `www/app/routes/guide/getting-started.tsx`

Exit:

- [x] `git grep -n "render(): string" -- docs www packages` returns only
      explicitly historical files.
- [x] `git grep -n "wrongTypeErrorHtml" -- packages/core/src` returns no rows.
- [x] `git grep -n "typeof result === 'string'" -- packages/core/src` returns
      no core component-render branch.

### W2: One Renderer Pipeline

Goal: one structural render model from VNode to output.

Tasks:

- [x] Ensure all string HTML output flows through `RenderNode` serialization.
- [x] Ensure DSD host wrapping is represented as `RenderNode`.
- [x] Ensure attribute serialization has one canonical implementation.
- [x] Ensure trusted HTML is represented only by a named trusted node/helper.
- [x] Remove renderer branches that duplicate serializer behavior.
- [x] Move adapter-specific conversion before core render entry.
- [x] Add tests proving VNode, fragment, nested DSD, trusted HTML, event markers,
      and void elements share one serializer.

Exit:

- [x] The renderer has one traversal and one serializer.
- [x] Adapter tests prove framework-specific values are converted before core.
- [x] `deno task test` covers renderer IR and DSD integration.

### W3: One Metadata Source of Truth

Goal: no hand-maintained package graph, source regex parsing, or generated-code
business logic.

Tasks:

- [x] Keep package publish/typecheck/dry-run order graph-derived.
- [x] Extend `graph:check` to validate internal `jsr:@lessjs/*` ranges against
      the current release line.
- [x] Ensure route metadata extraction uses AST or manifest data.
- [x] Replace `readStaticLessExport()` in
      `packages/adapter-vite/src/route-scanner.ts`.
- [x] Replace the source text export parser in
      `packages/content/src/nav/scanner.ts` with structured data or AST.
- [x] Ensure Hub data loading imports or reads structured data.
- [x] Ensure generated SSR entries are declarative wiring only.
- [x] Distinguish missing optional packages from broken installed packages.
- [x] Add tests for broken structured data imports and optional-package absence.

Exit:

- [x] `deno task graph:check` fails on stale internal version ranges.
- [x] No framework behavior depends on regex-parsing TypeScript source.
- [x] Generated code contains no complex business rules.

### W4: One Copy of Shared Logic

Goal: duplicate logic is removed, not merely documented.

Tasks:

- [x] Choose one canonical owner for `CompatibilityClassification`.
- [x] Delete duplicate compatibility classification interfaces.
- [x] Remove duplicate definitions from:
  - `packages/cem/src/cem-parser.ts`
  - `packages/compat-check/src/types.ts`
  - `packages/core/src/types.ts`
- [x] Move Hub CLI record loading into a shared helper.
- [x] Move Hub snapshot placeholder rendering into a shared helper.
- [x] Extract adapter DSD hydration event binding into a shared helper.
- [x] Keep `escapeHtml` and `escapeAttr` canonical in `@lessjs/core`.
- [x] Remove redundant aliases such as local re-export types that only preserve
      old package boundaries.

Exit:

- [x] `git grep -n "interface CompatibilityClassification" -- packages` returns
      one canonical definition.
- [x] `git grep -n "function loadRecords" -- packages/hub/src` returns one
      canonical definition.
- [x] `git grep -n "function renderPlaceholder" -- packages/hub/src` returns one
      canonical definition.
- [x] adapter hydration packages import shared event-binding logic instead of
      carrying local copies.

### W5: Type Escape Closure

Goal: production type escapes are either gone or intentionally documented.

Tasks:

- [x] Keep production `as any` at zero.
- [x] Classify every production `as unknown as`:
  - removable abstraction gap
  - DOM library limitation
  - mixin constructor limitation
  - test-only fixture
  - external package type limitation
- [x] Remove all abstraction-gap casts.
- [x] Add a typed allowlist for remaining production casts.
- [x] Require each allowed cast to include a short `type-escape:` comment.
- [x] Add `arch:check` coverage for cast counts and allowlist drift.
- [x] Prioritize production cast hotspots:
  - `packages/core/src/island.ts`
  - `packages/core/src/prop.ts`
  - `packages/core/src/dsd-element.ts`
  - `packages/adapter-lit/src/dsd-hydration.ts`
  - `packages/adapter-react/src/dsd-hydration.ts`
  - `packages/adapter-vanilla/src/dsd-hydration.ts`
  - `packages/router/src/client-router.ts`

Exit:

- [x] production `as any` count is zero.
- [x] production `as unknown as` count equals the allowlist exactly.
- [x] every remaining production cast has a reason.

### W6: Trust Boundary Cleanup

Goal: security-sensitive names describe real behavior.

Tasks:

- [x] Decide final public name for trusted HTML input.
- [x] Prefer `trustedHtml` or `trustedHTML` over `rawHtml` for new current API.
- [x] Keep core as a trust boundary, not a sanitizer.
- [x] Keep sanitizer usage in content/head pipelines where untrusted HTML enters.
- [x] Update tests to prove untrusted `innerHTML` is escaped by default.
- [x] Update tests to prove trusted HTML is not sanitized by core.
- [x] Update current docs to say where sanitization belongs.

Exit:

- [x] current docs do not imply core sanitizes trusted HTML.
- [x] content/head sanitizer tests still pass.
- [x] renderer tests prove the trust boundary behavior.

### W7: Completed SOP and Docs Truth Gate

Goal: documentation claims match executable evidence.

Tasks:

- [x] Audit `docs/sop`, `docs/adr`, `docs/changelog`, and `docs/release`.
- [x] For every current "Completed" claim, verify the code or gate.
- [x] Downgrade, correct, or add gates for unproved claims.
- [x] Update `docs/arch/current-architecture.md`.
- [x] Update getting started and API examples.
- [x] Add `arch:check` to root tasks.
- [x] Ensure `docs:check-current` and `arch:check` cover current docs, not only
      a small hand-picked list.

Exit:

- [x] no current docs teach removed APIs.
- [x] completed current SOP claims are gate-proved.
- [x] release notes do not claim publication or behavior that has not happened.

### W8: Release Closure

Goal: prove and publish the cleaned architecture.

Tasks:

- [x] Bump all 19 packages to `0.30.0`.
- [x] Update all internal `jsr:@lessjs/*` ranges to the v0.30.0 line.
- [x] Write `docs/changelog/v0.30.0.md`.
- [x] Write `docs/release/v0.30.0.md`.
- [x] Run full local gates:

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

- [x] Push `dev`.
- [x] Wait for `dev` CI to pass.
- [x] Merge `main` only after `dev` is green.
- [x] Wait for `main` CI and publish workflow.

Exit:

- [x] local full gate passes.
- [x] `dev` CI passes.
- [x] `main` CI passes.
- [x] JSR publish workflow and consumer smoke pass.

Local gate evidence captured on 2026-06-04:

| Gate                            | Result                                 |
| ------------------------------- | -------------------------------------- |
| `deno task fmt:check`           | PASS, 773 files checked                |
| `deno task lint`                | PASS, 283 files checked                |
| `deno task typecheck`           | PASS, 19-package graph order           |
| `deno task test`                | PASS, 1297 tests / 222 steps           |
| `deno task docs:check-current`  | PASS, no legacy current-doc references |
| `deno task docs:check-strategy` | PASS, 5 checks / 31 files              |
| `deno task graph:check`         | PASS, 19 packages on 0.30.0            |
| `deno task arch:check`          | PASS after staging, 960 tracked files  |
| `deno task build`               | PASS, 354 HTML files / 324 DSD pages   |
| `deno task dsd:check-report`    | PASS, 0 total errors                   |
| `deno task publish:dry-run`     | PASS, 19 packages                      |

## Architecture Gate Specification

Implement `deno task arch:check` as a deterministic repository gate.

Minimum checks:

| Check                     | Failure condition                                                        |
| ------------------------- | ------------------------------------------------------------------------ |
| Byte-read inventory       | tracked-file byte read has any failure                                   |
| Render contract           | current docs or current source examples teach `render(): string`         |
| Core string branch        | `packages/core/src` contains component `typeof result === 'string'` path |
| Legacy error helper       | `wrongTypeErrorHtml` exists                                              |
| Type escapes              | production `as any` is nonzero                                           |
| Type escapes              | production `as unknown as` differs from allowlist                        |
| TS suppressions           | production `@ts-ignore` or unapproved `@ts-expect-error` exists          |
| TODO/FIXME                | production TODO/FIXME is unclassified                                    |
| Duplicate types           | more than one canonical `CompatibilityClassification` definition         |
| Duplicate Hub CLI helper  | more than one `loadRecords()` implementation                             |
| Duplicate snapshot helper | more than one `renderPlaceholder()` implementation                       |
| Version ranges            | internal `jsr:@lessjs/*` range is below release line                     |
| Generated boundary        | framework behavior regex-parses TypeScript source                        |
| Docs truth                | completed current SOP claim lacks a verification gate                    |

## Non-Goals

- Do not implement UI Shell, Ocean-Island, daisyUI fork, or `@lessjs/ui/css`.
- Do not add new user-facing features.
- Do not preserve removed APIs with deprecation shims.
- Do not rewrite historical ADRs unless they are imported into current docs.
- Do not clean ignored/generated files by hand unless the build process owns
  them.

## Risk Controls

| Risk                                      | Control                                                           |
| ----------------------------------------- | ----------------------------------------------------------------- |
| Breaking user code that returns strings   | This is intended before API freeze; provide a migration note only |
| Cast cleanup causing TS churn             | Classify first, then remove by owner area                         |
| Adapter conversion leaking back into core | Add adapter-boundary tests                                        |
| Docs overstating completion again         | Make `arch:check` fail on unproved current claims                 |
| Hidden generated-data dependency          | Add broken structured data tests                                  |
| Release metadata drift                    | Extend `graph:check` for internal version lines                   |

## Exit Criteria

v0.30.0 is complete only when all of the following are true:

- [x] one public render contract exists in source, types, docs, and examples
- [x] one renderer pipeline handles core SSR/DSD output
- [x] metadata and generated-data boundaries are structured and gate-proved
- [x] listed duplicate logic has one canonical owner
- [x] production type escapes are zero or allowlisted with reasons
- [x] current docs no longer teach old APIs
- [x] all completed SOP claims are backed by commands
- [x] all 19 packages are `0.30.0`
- [x] full local gate passes
- [x] `dev` and `main` CI pass
- [x] publish dry-run passes
- [x] main publish workflow and consumer smoke pass
