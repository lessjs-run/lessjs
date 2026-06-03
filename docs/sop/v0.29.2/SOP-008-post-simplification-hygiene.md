# SOP-008: v0.29.2 Post-Simplification Hygiene

> Version: v0.29.2
> Date: 2026-06-03
> Status: Completed
> ADR: [ADR-0078](../../adr/ADR-0078-core-simplification-and-merge.md)
> Output: orphan references cleaned, docs updated, import maps consistent

## Summary

v0.29.1 deleted 7 source files and 3 subpath exports. A second full scan
found residual references: orphan import map entries, stale test fixtures,
outdated comments, and API docs still documenting the removed `renderToString`.

## Scope

- Remove orphan import map entries referencing deleted files.
- Update test fixtures that direct-reference deleted paths.
- Update API documentation (English and Chinese).
- Fix stale JSDoc comments.

## Execution

### 1. Orphan import map cleanup

```bash
# deno.json
- "@lessjs/core/api": "./packages/core/src/api.ts"  # removed

# ssg-package-resolver.ts
- api: 'src/api.ts'  # removed
```

### 2. Test fixture updates

```bash
# create/__tests__/cli.test.ts
- @lessjs/core/render-instantiate → @lessjs/core/render-ir

# adapter-vite/__tests__/ssg-package-resolver.test.ts
- src/jsx-render-string.ts → src/render-ir.ts
```

### 3. Documentation updates

```bash
# www/content/guide/en/api.md + zh/api.md
- renderToString → renderDsdTree (with await)
```

### 4. Stale comments

```bash
# packages/core/src/security.ts
- render-instantiate.ts → render-dsd.ts
```

## Verification

- `deno task fmt:check` — 744 files clean
- `deno task lint` — 280 files clean
- `deno task typecheck` — 19/19 packages
- `deno task graph:check` — passed
