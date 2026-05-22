# SOP-016: DsdElement Sufficiency Hardening

> ADR: ADR-0036 Ocean-Island Architecture, ADR-0037 DSD-First Strategic Boundary
> Depends on: SOP-013, SOP-014, SOP-015
> Status: Completed

## Goal

Close the gap between the v0.20.0 DsdElement implementation and the public
documentation/product surface. This SOP does not introduce another ADR; it
turns the existing ADR/SOP decisions into repository checks and cleanup.

## Scope

1. Confirm `DsdElement` exists as real public API in `@lessjs/core`.
2. Confirm `renderDSD()` extracts native `StyleSheet`/DsdElement styles before
   falling back to framework adapters.
3. Confirm `@lessjs/ui` components use `DsdElement` for Ocean components.
4. Remove or update stale public examples that still teach Lit as the default
   page authoring model.
5. Update Hub scanner language so first-party LessJS UI is described as
   DsdElement-based, not DsdLitElement-based.
6. Run release-quality verification and update the v0.20.0 changelog.

## Findings Before Work

- `DsdElement` and its tests already exist on `dev`.
- `less-card`, `less-callout`, `less-step-card`, `less-button`, `less-input`,
  `less-theme-toggle`, `less-code-block`, `less-dialog`, and `less-layout`
  already use `DsdElement`.
- Some public docs and scanner metadata still mention Lit/DsdLitElement as the
  first-party default, which weakens the DSD-first story.
- `less-layout` remains large and should be split in a later SOP. This SOP does
  not attempt that migration.

## Actions

### 1. Public Example Cleanup

- Update Getting Started page examples to import `DsdElement` from
  `@lessjs/core`.
- Ensure page examples return string HTML, not Lit `html` templates.

### 2. Hub Metadata Cleanup

- Update `packages/hub/src/scanner.ts` first-party package description and
  justification to say DsdElement / DSD-native components.
- Include all first-party UI tags in local scanner metadata.

### 3. Verification

Run:

- `deno task fmt:check`
- `deno task docs:check-strategy`
- `deno task lint`
- `deno task typecheck`
- `deno task test`
- `deno task build`
- `deno task dsd:check-report`
- `deno task hub:validate --strict --json`
- `deno task hub:check-index`

## Exit Criteria

- Public getting-started examples no longer teach Lit as the default route
  component model.
- First-party Hub metadata no longer claims `DsdLitElement` as the UI base.
- Existing DsdElement tests continue to pass.
- Full repo gates pass.

## Deferred Work

- Split `less-layout` into smaller layout/navigation/theme modules.
- Decide when `@lessjs/adapter-lit` can move from compatibility bridge to
  optional legacy package.
- Add a focused guard that fails if first-party Ocean components import Lit.
