# SOP-004: Signals, Schema, and Validation Hardening

> Version: v0.22.0\
> Priority: P1\
> Status: PLANNED\
> Depends on: SOP-002, SOP-003

## Objective

Reduce long-term maintenance risk in reactivity and validation without breaking
public imports or weakening LessJS-specific diagnostics.

## Scope

| Area                  | Action                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------- |
| Signals               | Introduce a facade/engine boundary and evaluate `alien-signals` behind it                   |
| DsdElement            | Preserve runtime binding and patch semantics while reducing manual signal subscription code |
| Template signals      | Prefer branded signal detection while retaining compatibility where needed                  |
| Hub/schema validation | Evaluate shared schema definitions without losing strict diagnostics                        |
| CEM/manifest types    | Reuse owning package types and avoid repeated local shapes                                  |

## Procedure

### Step 1: Signals Facade Contract

- [ ] Define the public contract for `signal`, `computed`, `effect`,
      `subscribe`, `.value`, and cleanup behavior.
- [ ] Keep `@lessjs/signals` and `@lessjs/signals/framework` import paths.
- [ ] Mark `batch()` and other legacy sugar according to existing deprecation
      policy, not by silent removal.

Acceptance:

- [ ] Existing `packages/signals` tests still express the facade contract.
- [ ] Public docs do not tell users to import a third-party signal engine.

### Step 2: Engine Experiment

- [ ] Build a branch-local adapter around `alien-signals`.
- [ ] Prove `.value`, `subscribe`, computed laziness, cleanup, and DsdElement
      updates match current behavior.
- [ ] Measure package-size and test-impact changes.
- [ ] Keep an escape path to the current engine if behavior differs.

Acceptance:

- [ ] The experiment can be reverted without touching user imports.
- [ ] No generated project must add `alien-signals` by hand.

### Step 3: DsdElement Subscription Simplification

- [ ] Identify which manual code is pure signal subscription.
- [ ] Do not remove runtime binding, event binding, property binding,
      `data-less-b` patching, or disconnect cleanup.
- [ ] Replace only the parts that tests prove are equivalent.

Acceptance:

- [ ] Reactive DSD tests cover batching, cleanup, nested templates, events, and
      last-good-DOM behavior.

### Step 4: Validation Schema Experiment

- [ ] Define the canonical diagnostic output before changing implementation.
- [ ] Evaluate Valibot or equivalent only as an internal implementation tool.
- [ ] Preserve strict Hub submission gates, manifest hash checks, artifact
      content checks, and custom-element tag diagnostics.

Acceptance:

- [ ] Existing validation tests pass.
- [ ] CLI output remains actionable and stable.

## Verification

```sh
deno test packages/signals/__tests__ --allow-read --allow-write --allow-env --allow-run
deno test packages/core/__tests__/reactive-dsd.test.ts --allow-read --allow-write --allow-env --allow-run
deno test packages/core/__tests__/validate-manifest.test.ts --allow-read --allow-write --allow-env
deno test packages/hub/__tests__ --allow-read --allow-write --allow-env --allow-net --allow-run
deno task typecheck
```

## Exit Criteria

- Signals have a stable facade regardless of engine choice.
- Validation ownership is clearer and no strict gate is weakened.
- No public import path is removed in v0.22 without documented deprecation.
