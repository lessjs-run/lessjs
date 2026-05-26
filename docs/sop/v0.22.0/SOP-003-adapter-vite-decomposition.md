# SOP-003: adapter-vite Decomposition

> Version: v0.22.0\
> Priority: P0\
> Status: PLANNED\
> Depends on: SOP-001, SOP-002

## Objective

Split `packages/adapter-vite/src/index.ts` and related build orchestration into
small modules with explicit responsibilities and focused tests.

## Target Modules

| Module                      | Responsibility                                    |
| --------------------------- | ------------------------------------------------- |
| `less-plugin.ts`            | Public plugin assembly and option normalization   |
| `head-injection.ts`         | Head fragments, safety checks, and serialization  |
| `subpath-resolver.ts`       | LessJS/UI subpath resolution helpers              |
| `optional-package-stubs.ts` | Optional adapter stubs and stable plugin identity |
| `phase-context.ts`          | Shared build context wiring                       |
| existing CLI files          | Phase 1/2/3 execution only                        |

File names may change during implementation, but these responsibilities must
not remain tangled in one module.

## Procedure

### Step 1: Lock Current Behavior

- [ ] Add or confirm tests for plugin order by plugin identity, not array
      length.
- [ ] Add focused tests for optional package stubs.
- [ ] Add tests for head injection safety boundaries.
- [ ] Add tests for subpath resolution.

Acceptance:

- [ ] Behavior is covered before extraction begins.

### Step 2: Extract One Responsibility at a Time

- [ ] Move optional package stubs first because they are high-risk generated
      project infrastructure.
- [ ] Move head injection next.
- [ ] Move subpath resolution next.
- [ ] Keep the public `less()` export stable.

Acceptance:

- [ ] After each extraction, targeted adapter tests pass.
- [ ] No unrelated feature work is bundled with the extraction.

### Step 3: Clarify Phase Boundaries

- [ ] Keep Phase 1 route/island scan data explicit.
- [ ] Keep Phase 2 client island build import-map resolution isolated.
- [ ] Keep Phase 3 SSG pre-resolution and external manifest logic isolated.
- [ ] Remove stale comments that describe old phase ordering.

Acceptance:

- [ ] A reader can identify which module owns each build phase.
- [ ] `IMPORT_IS_UNDEFINED` route-tag fixes remain covered.

## Verification

```sh
deno test packages/adapter-vite/__tests__ --allow-read --allow-write --allow-env --allow-run --allow-net --allow-ffi
deno task typecheck
deno task build
deno task dsd:check-report
```

## Exit Criteria

- `adapter-vite/src/index.ts` is primarily orchestration, not implementation.
- Optional stubs, head injection, and subpath resolution are independently
  testable.
- Build phases have clear data handoff contracts.
