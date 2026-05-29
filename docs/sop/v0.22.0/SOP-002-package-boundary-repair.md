# SOP-002: Package Boundary Repair

> Version: v0.22.0\
> Priority: P0\
> Status: PLANNED\
> Depends on: SOP-001

## Objective

Restore clear ownership between runtime packages, build packages, and extracted
helper packages. A package that is presented as independent must own real code
or explicitly be a compatibility facade.

## Required Repairs

| Area                                   | Problem                                                             | Target                                                                  |
| -------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `@lessjs/core`                         | Owns build-only files such as `build-types.ts` and `virtual-ids.ts` | Move adapter-only contracts to `adapter-vite` or a small shared package |
| `@lessjs/style-sheet`                  | Duplicates `core/src/style-sheet.ts`                                | Make one implementation authoritative                                   |
| `@lessjs/cem` / `@lessjs/compat-check` | Risk of thin-wrapper package claims                                 | Clarify ownership and public docs                                       |
| UI helpers                             | `_escAttr` duplicated in components                                 | Use shared helper without widening public API unnecessarily             |
| Hub scanner                            | `records.push(null!)` placeholder                                   | Replace with typed accumulation                                         |

## Procedure

### Step 1: Classify Files by Ownership

- [ ] List every `packages/core/src/*` file.
- [ ] Mark each as runtime kernel, public type, build contract, or historical
      compatibility shim.
- [ ] Repeat for extracted helper packages.

Acceptance:

- [ ] Every file has an owner category.
- [ ] Build-only code in core has a migration target.

### Step 2: Repair `StyleSheet` Ownership

- [ ] Choose one canonical implementation.
- [ ] If `@lessjs/style-sheet` owns the implementation, make core re-export or
      depend on it deliberately.
- [ ] If core owns the implementation, document `@lessjs/style-sheet` as a
      facade and stop claiming full extraction.

Acceptance:

- [ ] No identical implementation is maintained in two packages.
- [ ] `DsdElement` and `renderDsd()` still typecheck.

### Step 3: Move Build Contracts Out of Core

- [ ] Move `build-types.ts` and `virtual-ids.ts` to an adapter-owned location or
      a clearly named shared internal contract.
- [ ] Update imports and tests.
- [ ] Avoid circular imports by keeping runtime types separate from build-phase
      data.

Acceptance:

- [ ] `@lessjs/core` public exports remain runtime-focused.
- [ ] `adapter-vite` tests pass without importing build-only contracts from
      core.

### Step 4: Remove Unsafe Placeholders and Duplicates

- [ ] Replace `records.push(null!)` with typed object construction.
- [ ] Consolidate local escape helpers in UI components where the shared helper
      does not create a new public commitment.
- [ ] Reuse CEM types from the owning package instead of local copies.

Acceptance:

- [ ] No `null!` placeholder remains in Hub scanner flow.
- [ ] Duplicate helpers are removed or justified.

## Verification

```sh
deno task typecheck
deno test packages/core/__tests__ --allow-read --allow-write --allow-env --allow-run
deno test packages/ui/__tests__ --allow-read --allow-write --allow-env
deno test packages/hub/__tests__ --allow-read --allow-write --allow-env --allow-net --allow-run
```

## Exit Criteria

- Core, adapter, helper packages, and Hub have clear ownership boundaries.
- Public docs no longer overstate package extraction maturity.
