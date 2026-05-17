# Registry Hub v0.19 Audit Gaps

**Status**: **Closed** — all blockers resolved.

**Date**: 2026-05-17

**Closing evidence**:

## Blockers

### 1. `less hub submit` cannot reach PR mode ✅

**Fix**: Added `--submit` flag (`hub-submit.ts`). Default is still `--dry-run`, but `--submit` sets `dryRun=false, skipPr=false`.

**Files**: `packages/hub/src/cli/hub-submit.ts`

**Tests**: 4 new CLI tests (`hub-submit.test.ts`)

**Verification**:
```bash
deno run --allow-read --allow-write --allow-env --allow-run packages/hub/src/cli/hub-submit.ts --help
deno run --allow-read --allow-write --allow-env --allow-run packages/hub/src/cli/hub-submit.ts --dir packages/hub --dry-run
```

### 2. Submission CLI does not use real validation/build artifacts ✅

**Fix**: CLI now passes `manifestContent` through `buildPackageRecord()` which computes real sha256 hash and preserves all validation data. CLI reads package.json/deno.json and CEM, classifies compatibility, and builds full record.

**Files**: `packages/hub/src/cli/hub-submit.ts`, `packages/hub/src/builder.ts`

**Verification**: CLI output includes real validation JSON, compatibility tiers, and manifest hash.

### 3. Manifest integrity is not implemented ✅

**Fix**: Added `computeManifestHash()` in `schema.ts` using `crypto.subtle.digest('SHA-256')`. Builder auto-computes hash when `manifestContent` is provided.

**Files**: `packages/hub/src/schema.ts`, `packages/hub/src/builder.ts`

**Tests**: 2 new tests in `builder.test.ts` (hash computation + determinism)

**Verification**:
```bash
deno test packages/hub/__tests__/builder.test.ts
```

### 4. Hub CI is too shallow to be a trust gate ✅

**Fix**: 
- New `packages/hub/src/cli/validate.ts` — schema validation, manifest hash check, duplicate tag hard failure, missing artifact hard failure
- New `packages/hub/src/cli/check-index.ts` — regenerates index.json and exits 1 on drift
- Updated `hub-ci.yml` uses Deno validator instead of ad hoc jq checks

**Files**: `.github/workflows/hub-ci.yml`, `packages/hub/src/cli/validate.ts`, `packages/hub/src/cli/check-index.ts`

**Verification**:
```bash
deno task hub:validate
deno task hub:check-index
```

### 5. Registry package detail pages are not statically generated ✅

**Fix**: Added `getStaticPaths()` to `[package].ts` that reads hub-index and returns all package paths. SSG emits detail pages for all records.

**SSG output**:
- `www/dist/registry/%40lessjs~ui/index.html`
- `www/dist/registry/%40shoelace-style~shoelace/index.html`
- `www/dist/registry/media-chrome/index.html`

**Files**: `www/app/routes/registry/[package].ts`

**Verification**:
```bash
deno task build
find www/dist/registry -type f
```

### 6. Registry UI references a missing island ✅

**Fix**: Already fixed earlier — `_renderer.ts` is empty (returns html unchanged).

**Files**: `www/app/routes/registry/_renderer.ts`

### 7. Root validation and publish flows do not include Hub ✅

**Fix**: 
- Hub entrypoints added to root `typecheck` task
- `publish:hub` and `publish:hub --dry-run` tasks added
- Hub added to `publish` and `publish:dry-run` chains
- `README.md` and `LICENSE` created in `packages/hub/`

**Files**: `deno.json`, `packages/hub/README.md`, `packages/hub/LICENSE`

### 8. Lint and format gates currently fail ✅

**Fix**: All lint errors (6 issues) and format errors (7 files) fixed.

**Verification**:
```bash
deno lint    # passes
deno fmt --check  # passes
```

## Final Verification

```bash
deno lint                          # ✅ 0 errors
deno fmt --check                   # ✅ 0 errors
deno task typecheck                # ✅ passes (includes hub)
deno test --allow-read --allow-write --allow-env --allow-net --allow-run  # ✅ 715 passed
deno task build                    # ✅ complete, 3 registry detail pages generated
deno task hub:validate             # ✅ all records valid
deno task hub:check-index          # ✅ index up to date
```

## Conclusion

All 8 blockers are resolved. v0.19.0 can be marked as **Done** once STATUS.md is updated and changes are committed.
