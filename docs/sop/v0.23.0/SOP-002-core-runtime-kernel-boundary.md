# SOP-002: Core Runtime Kernel Boundary

> Version: v0.23.0\
> Priority: P0\
> Status: PLANNED\
> Depends on: SOP-001

## Objective

Keep `@lessjs/core` as the runtime kernel: DSD rendering, safe templates,
`DsdElement`, island runtime primitives, navigation, logging, and runtime
protocol integration.

## Current Problem

`@lessjs/core` is still pulled toward a convenience barrel:

- it exports runtime helpers and large type surfaces;
- it has compatibility bridges for extracted packages;
- it currently exposes signal helpers for single-import DX;
- it remains the natural place for future code unless ownership is explicit.

This weakens the Web Standards-first kernel. It also increases the chance of
JSR publish cycles and accidental transitive dependencies.

## Target Contract

`@lessjs/core` should own:

- `DsdElement`;
- `html`, `unsafeHTML`, template rendering and escaping;
- `renderDSD()` and streaming primitives;
- runtime island contracts;
- navigation helpers;
- runtime logger and errors;
- adapter protocol types that are genuinely runtime-facing.

`@lessjs/core` should not own:

- Vite build contracts;
- virtual module ids;
- alien-signals runtime implementation;
- canonical StyleSheet implementation if `@lessjs/style-sheet` owns it;
- CEM or compatibility implementation if extracted packages own them;
- product-level single-import facade duties.

## Export Classification Policy

Every core export must be assigned exactly one class:

| Class                | Meaning                              | v0.23 action                           |
| -------------------- | ------------------------------------ | -------------------------------------- |
| kernel               | required for DSD runtime             | keep in core                           |
| runtime protocol     | consumed by runtime/adapter boundary | keep or move to protocols after review |
| compatibility bridge | old path for extracted owner         | keep temporarily with target owner     |
| historical bridge    | no longer recommended                | deprecate or move                      |
| wrong owner          | build/feature/tooling concept        | migrate out before v0.23 exit          |

The classification table belongs in the implementation PR and should be copied
into release notes if public imports change.

## Procedure

### Step 1: Classify Core Exports

- [ ] Classify every `@lessjs/core` export as kernel, runtime protocol,
      compatibility bridge, historical bridge, or wrong owner.
- [ ] Mark each compatibility bridge with an owner and a deprecation policy.
- [ ] Identify exports that exist only because templates or docs use a
      convenient import.

Acceptance:

- [ ] No export is removed without a compatibility plan.
- [ ] The public API table is included in the implementation PR.

### Step 2: Remove Implementation Ownership Drift

- [ ] Move signal implementation imports out of core, or document a temporary
      bridge that delegates to the correct owner.
- [ ] Keep `SignalLike` detection in core only if template rendering needs it
      without importing a concrete signal engine.
- [ ] Keep `StyleSheet` canonical ownership in one package.
- [ ] Keep CEM and compatibility implementation in the owning packages.

Acceptance:

- [ ] `@lessjs/core` does not import `alien-signals`.
- [ ] `@lessjs/core` does not depend on adapter packages.
- [ ] `@lessjs/core` publish dry-run does not require unpublished LessJS
      implementation packages except accepted compatibility bridges.
- [ ] `@lessjs/core/signals` is either a documented bridge to
      `@lessjs/signals` or removed from the recommended path.

### Step 3: Preserve Runtime Behavior

- [ ] Keep `DsdElement` rendering behavior unchanged.
- [ ] Keep safe template escaping unchanged.
- [ ] Keep reactive DSD behavior covered through protocol tests.
- [ ] Keep hydration strategy vocabulary unchanged.

Acceptance:

- [ ] Existing component tests pass.
- [ ] Existing generated project builds.

### Step 4: Remove Tooling Ownership From Core

- [ ] Move canonical CEM parser ownership to `@lessjs/cem` or keep a documented
      bridge only.
- [ ] Move canonical compatibility classifier ownership to
      `@lessjs/compat-check` or keep a documented bridge only.
- [ ] Move manifest validation primitives to the contracts layer or owning
      validation package.
- [ ] Keep runtime errors and logger in core only where runtime code needs them.

Acceptance:

- [ ] `hub`, `cem`, and `compat-check` do not need core internals to share
      schema concepts.
- [ ] `core` exports read as runtime APIs, not registry/tooling APIs.

## Verification

```sh
deno check packages/core/src/index.ts
deno test packages/core/__tests__ --allow-read --allow-write --allow-env --allow-run --allow-ffi
deno test packages/ui/__tests__ --allow-read --allow-write --allow-env
cd packages/core && deno publish --dry-run --allow-dirty
```

## Exit Criteria

- `@lessjs/core` is explainable as a runtime kernel.
- Convenience imports live in a facade layer or are explicitly deprecated.
- Core remains publishable without circular package dependencies.
