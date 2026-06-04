# SOP-001: Contracts and Protocols Package

> Version: v0.23.0\
> Priority: P0\
> Status: IMPLEMENTED\
> Depends on: ADR-0050

## Objective

Create one clear owner for shared LessJS contracts that are neither runtime
implementation nor Vite adapter implementation.

## Current Problem

Shared contracts are currently scattered:

- `LessBuildContextLike` and virtual module ids live under
  `@openelement/adapter-vite`.
- signal protocol types are duplicated between `@openelement/core` and
  `@openelement/signals`.
- Hub, CEM, manifest, compatibility, and validation diagnostics still share
  concepts through package-specific imports.
- Feature packages depend on adapter-owned types to integrate with the build.

## Target Contract

Introduce a contracts layer, either as `@openelement/protocols` or a deliberately
named equivalent.

Default name: `@openelement/protocols`. Use a different name only if the
implementation PR records a clearer distinction between runtime protocols and
build protocols.

It may own:

- build context interfaces used by build-time plugins;
- virtual module id constants;
- signal protocol types;
- shared diagnostics and validation result shapes;
- manifest and compatibility type primitives;
- package graph metadata used by release tooling.
- generated-project direct import declarations used by release gates.

It must not own:

- `DsdElement`;
- template rendering;
- Vite plugin implementation;
- filesystem scanning;
- reactive engine implementation;
- Hub submission side effects.
- user-facing `lessjs()` configuration assembly.

## Ownership Rules

| Contract type            | Owner                               | Notes                                          |
| ------------------------ | ----------------------------------- | ---------------------------------------------- |
| virtual module ids       | protocols                           | adapter consumes, feature packages may consume |
| build context shape      | protocols                           | adapter owns mutable implementation            |
| signal-like protocol     | protocols or signals                | protocol only; engine stays in signals         |
| manifest primitives      | protocols or owning feature package | avoid routing through core                     |
| diagnostics result shape | protocols                           | implementation packages attach details         |
| logger runtime           | core                                | not a cross-package protocol unless proven     |
| Vite plugin type         | adapter-vite/app                    | do not leak through protocols                  |

## Procedure

### Step 1: Inventory Shared Contracts

- [ ] List every exported type and constant from `@openelement/core`,
      `@openelement/adapter-vite`, `@openelement/signals`, `@openelement/hub`, `@openelement/cem`,
      and `@openelement/compat-check`.
- [ ] Mark each item as runtime kernel, build contract, feature API,
      diagnostics contract, obsolete export, or wrong owner.
- [ ] Identify all imports from `@openelement/adapter-vite/build-types` and
      `@openelement/adapter-vite/virtual-ids`.

Acceptance:

- [ ] The migration list names every source file and target owner.
- [ ] No type is moved before its runtime dependency graph is understood.
- [ ] The inventory identifies public, internal, obsolete, and wrong-owner
      exports.

### Step 2: Add the Contracts Package

- [ ] Add package metadata and exports.
- [ ] Keep the package dependency-free unless a dependency is justified in the
      ADR or SOP.
- [ ] Export only stable contracts, not convenience barrels.
- [ ] Add root import-map aliases for local development.

Acceptance:

- [ ] `deno publish --dry-run --allow-dirty` passes for the new package.
- [ ] The package has no dependency on `@openelement/core`, `@openelement/adapter-vite`,
      or `@openelement/signals`.

### Step 3: Migrate Build Contracts

- [ ] Move `LessBuildContextLike` or equivalent build plugin context types.
- [ ] Move virtual module id constants.
- [ ] Update `content`, `i18n`, `app`, and `adapter-vite` imports.
- [ ] Delete old adapter-owned contract exports instead of preserving a
      compatibility bridge.

Acceptance:

- [ ] `content` and `i18n` no longer import adapter-vite only to get build
      contracts.
- [ ] Existing generated projects still build.
- [ ] `@openelement/app` does not import `@openelement/adapter-vite/build-context`.

### Step 4: Migrate Protocol Types

- [ ] Move or unify `SignalEngine`, `WritableSignal`, `ReadonlySignal`, and
      `Unsubscribe`.
- [ ] Define one owner for manifest, compatibility, and validation diagnostic
      primitives.
- [ ] Remove duplicate local type definitions after canonical owners are in
      place.

Acceptance:

- [ ] Public signal API behavior is unchanged.
- [ ] Type imports form an acyclic graph.
- [ ] The public docs say `@openelement/signals` is powered by `alien-signals`, not a
      custom LessJS engine.

### Step 5: Delete Wrong-Owner Paths

- [ ] Remove old exports whose only purpose is backward compatibility.
- [ ] Remove root import-map aliases for deleted old paths.
- [ ] Update package resolvers and generated-source helpers so they cannot
      resolve deleted old paths.
- [ ] Document the canonical owner in docs and release notes.

Acceptance:

- [ ] No wrong-owner contract path remains exported.
- [ ] The release notes list breaking import-path moves.

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

## v0.23.0 Result

- `@openelement/protocols` owns shared build context contracts and virtual module
  ids.
- `@openelement/content`, `@openelement/i18n`, and `@openelement/adapter-vite` consume those
  contracts from `@openelement/protocols`.
- Old adapter-owned contract exports and root import-map aliases for removed
  wrong-owner paths were deleted.
- `deno task graph:check` now verifies source-level direct `@openelement/*` imports
  against each package-local `deno.json`.
