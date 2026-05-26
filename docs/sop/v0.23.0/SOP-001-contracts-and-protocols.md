# SOP-001: Contracts and Protocols Package

> Version: v0.23.0\
> Priority: P0\
> Status: PLANNED\
> Depends on: ADR-0050

## Objective

Create one clear owner for shared LessJS contracts that are neither runtime
implementation nor Vite adapter implementation.

## Current Problem

Shared contracts are currently scattered:

- `LessBuildContextLike` and virtual module ids live under
  `@lessjs/adapter-vite`.
- signal protocol types are duplicated between `@lessjs/core` and
  `@lessjs/signals`.
- Hub, CEM, manifest, compatibility, and validation diagnostics still share
  concepts through package-specific imports.
- Feature packages depend on adapter-owned types to integrate with the build.

## Target Contract

Introduce a contracts layer, either as `@lessjs/protocols` or a deliberately
named equivalent.

It may own:

- build context interfaces used by build-time plugins;
- virtual module id constants;
- signal protocol types;
- shared diagnostics and validation result shapes;
- manifest and compatibility type primitives;
- package graph metadata used by release tooling.

It must not own:

- `DsdElement`;
- template rendering;
- Vite plugin implementation;
- filesystem scanning;
- reactive engine implementation;
- Hub submission side effects.

## Procedure

### Step 1: Inventory Shared Contracts

- [ ] List every exported type and constant from `@lessjs/core`,
      `@lessjs/adapter-vite`, `@lessjs/signals`, `@lessjs/hub`, `@lessjs/cem`,
      and `@lessjs/compat-check`.
- [ ] Mark each item as runtime kernel, build contract, feature API,
      diagnostics contract, or compatibility bridge.
- [ ] Identify all imports from `@lessjs/adapter-vite/build-types` and
      `@lessjs/adapter-vite/virtual-ids`.

Acceptance:

- [ ] The migration list names every source file and target owner.
- [ ] No type is moved before its runtime dependency graph is understood.

### Step 2: Add the Contracts Package

- [ ] Add package metadata and exports.
- [ ] Keep the package dependency-free unless a dependency is justified in the
      ADR or SOP.
- [ ] Export only stable contracts, not convenience barrels.
- [ ] Add root import-map aliases for local development.

Acceptance:

- [ ] `deno publish --dry-run --allow-dirty` passes for the new package.
- [ ] The package has no dependency on `@lessjs/core`, `@lessjs/adapter-vite`,
      or `@lessjs/signals`.

### Step 3: Migrate Build Contracts

- [ ] Move `LessBuildContextLike` or equivalent build plugin context types.
- [ ] Move virtual module id constants.
- [ ] Update `content`, `i18n`, `app`, and `adapter-vite` imports.
- [ ] Keep compatibility re-exports only where they are needed for a minor
      release transition.

Acceptance:

- [ ] `content` and `i18n` no longer import adapter-vite only to get build
      contracts.
- [ ] Existing generated projects still build.

### Step 4: Migrate Protocol Types

- [ ] Move or unify `SignalEngine`, `WritableSignal`, `ReadonlySignal`, and
      `Unsubscribe`.
- [ ] Define one owner for manifest, compatibility, and validation diagnostic
      primitives.
- [ ] Remove duplicate local type definitions after compatibility bridges are
      in place.

Acceptance:

- [ ] Public signal API behavior is unchanged.
- [ ] Type imports form an acyclic graph.

## Verification

```sh
deno task fmt:check
deno task typecheck
deno test packages/content/__tests__ --allow-read --allow-write --allow-env
deno test packages/i18n/__tests__ --allow-read --allow-write --allow-env
deno publish --dry-run --allow-dirty
```

## Exit Criteria

- Shared contracts have one dependency-light owner.
- Feature packages do not depend on adapter implementation just to share types.
- The package graph remains acyclic and publishable.
