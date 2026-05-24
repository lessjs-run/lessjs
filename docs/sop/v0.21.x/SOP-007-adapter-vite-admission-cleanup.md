# SOP-007: Adapter Vite Admission and Build Report Cleanup

Status: planned\
Target version: v0.21.3\
Owner: adapter-vite package

## Objective

Make the Vite adapter a deterministic compiler layer for routes, islands, reports, and generated project behavior. This is the bridge from core API cleanliness to real SSG product reliability.

## Evidence Inputs

- `packages/adapter-vite/src/`
- `packages/adapter-vite/src/entry-descriptor.ts`
- `packages/adapter-vite/src/route-scanner.ts`
- `packages/adapter-vite/__tests__/`
- create-template Vite configs
- build output and DSD report

## Problem Statement

The audit identified build/report warnings and bundle-size pressure. Before v0.22.0 adds edge entrypoints, adapter-vite must be boring:

- route scanning should be deterministic;
- island admission should reject invalid states early;
- reports should connect route, component, chunk, and DSD evidence;
- generated projects should not need hidden aliases or private stubs;
- build warnings should be triaged or eliminated.

## Scope

Harden:

- route scanner output;
- entry descriptor schema;
- island strategy validation;
- report generation;
- generated project aliases;
- optional adapter stubs;
- build warning triage.

## Procedure

1. Reproduce current build warnings from `deno task build`.
2. Classify each warning:
   - real bug;
   - expected adapter artifact;
   - upstream tool limitation;
   - dead code or stale route metadata.
3. Add focused tests for route metadata and island admission.
4. Ensure invalid `client:*` strategies fail with actionable error text.
5. Ensure generated projects import only documented public subpaths.
6. Connect bundle report, DSD report, and island report fields where practical.
7. Set a finite JS budget for the docs/app route set.

## API Design Rules

- Adapter output is a contract between the compiler and runtime.
- The adapter may be experimental, but its report schema must be stable once used by gates.
- Do not silently coerce unknown hydration strategies.
- Do not allow private monorepo paths in generated project templates.
- Prefer schema validation over ad hoc string checks.

## Acceptance Criteria

- `deno task build` has no unexplained warnings.
- Island strategy validation covers `load`, `idle`, `visible`, and `only`.
- Generated project tests prove public import paths.
- Build report includes enough context to debug route/component/chunk regressions.
- DSD report thresholds are finite and documented.

## Validation Commands

```powershell
git status --short --branch
deno task fmt:check
deno task lint
deno task typecheck
deno test packages/adapter-vite packages/create
deno task build
deno task dsd:check-report
git status --short --branch
```

## Exit Decision

Proceed to SOP-008 when adapter-vite can build, report, and reject bad inputs without relying on tribal knowledge.
