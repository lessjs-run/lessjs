# SOP-005: Package Graph and Consumer Gates

> Version: v0.23.0\
> Priority: P0\
> Status: PLANNED\
> Depends on: SOP-001, SOP-003

## Objective

Make package publishing and generated consumer behavior mechanically verified,
not manually inferred from local typechecking.

## Current Problem

Recent release failures came from package graph reality:

- `@lessjs/core` and `@lessjs/signals` briefly formed a JSR publish cycle.
- `@lessjs/create@0.22.0` generated a `vite.config.ts` that imported `vite`
  without listing `vite` in the consumer import map.
- Post-publish smoke used an ambiguous latest create version instead of the
  just-published create version.

These failures are exactly the kind that local monorepo imports can hide.

## Target Gates

| Gate                     | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| package graph check      | no cycles, explain publish order             |
| package publish dry-run  | every changed package is publishable         |
| generated local consumer | workspace template builds                    |
| generated JSR consumer   | published packages build together            |
| Linux and Windows smoke  | shell/runtime differences are covered        |
| direct import map check  | every direct source import is declared       |
| docs/version consistency | README/status/roadmap/package versions agree |

The gates should be runnable locally before publish and reused by CI. They
should fail on structural package mistakes even when TypeScript can resolve
imports through the monorepo import map.

## Procedure

### Step 1: Add Package Graph Checker

- [ ] Parse every `packages/*/deno.json`.
- [ ] Build a graph of `@lessjs/*` dependencies.
- [ ] Detect cycles.
- [ ] Emit a publish order.
- [ ] Fail if workflow publish order differs from the computed order unless an
      exception is documented.
- [ ] Fail if a package imports another `@lessjs/*` package without declaring
      it in its local `deno.json`.

Acceptance:

- [ ] The former core/signals cycle would fail before publish.
- [ ] The checker runs in CI.
- [ ] The checker explains the cycle path or missing declaration path.

### Step 2: Add Direct Import Map Checker for Generated Projects

- [ ] Generate a project with `@lessjs/create`.
- [ ] Parse generated `.ts` files and `vite.config.ts`.
- [ ] Check that every bare direct import is listed in `deno.json` or is a
      runtime-provided built-in.
- [ ] Treat `vite` as a direct config import when `vite.config.ts` imports it.
- [ ] Check nested generated files, islands, routes, and config files.

Acceptance:

- [ ] The former missing `vite` import would fail before publish.
- [ ] The checker fails before post-publish smoke reaches JSR.

### Step 3: Pin Post-Publish Smoke to the New Version

- [ ] Read `packages/create/deno.json` in the smoke job.
- [ ] Run `jsr:@lessjs/create@<that version>`.
- [ ] Retry during JSR propagation.
- [ ] Avoid falling back to latest when validating a just-published release.

Acceptance:

- [ ] A bad older `@lessjs/create` release cannot be selected by accident.

### Step 4: Broaden Consumer Proof

- [ ] Linux published consumer smoke.
- [ ] Windows published consumer monitor.
- [ ] Local workspace generated consumer build.
- [ ] Optional preview/e2e proof when cost is acceptable.
- [ ] Record the exact package version used by every smoke run.

Acceptance:

- [ ] Generated projects are treated as product artifacts, not examples.

### Step 5: Protect Unified Version Releases

- [ ] Enforce that every `packages/*/deno.json` uses the same version during a
      unified release.
- [ ] Enforce that internal LessJS dependency constraints target that same
      version line.
- [ ] Fail if root lockfile or create fallback versions disagree with package
      versions.

Acceptance:

- [ ] A mixed `0.22.0` / `0.22.1` release cannot pass the release gate.
- [ ] The gate output names the mismatched packages and constraints.

## Verification

```sh
deno test packages/create/__tests__/cli.test.ts --allow-read --allow-write --allow-env --allow-run --allow-ffi
deno task typecheck
deno task fmt:check
cd packages/create && deno publish --dry-run --allow-dirty
```

## Exit Criteria

- CI catches package cycles, missing direct imports, and stale smoke versions.
- Publish workflow validates the newly published create package.
- Generated consumer failures are actionable and tied to a gate.
