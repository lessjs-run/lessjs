# LessJS v0.7.0 — Stable Baseline (P0 Audit Fixes)

**Release Date**: 2026-05-07

v0.7.0 is a **stability release** that addresses all P0 findings from the four-dimensional audit (2026-05-07). The focus is on eliminating untrusted behaviors and establishing engineering discipline. This release contains breaking changes (XSS fix, catch behavior change), hence the MINOR bump per SemVer 0.x conventions.

## What Changed

### Testing (73 new tests)

| Module | Tests | Lines Covered |
|--------|-------|---------------|
| `render-dsd.ts` | 44 | 770 (was 0) |
| `island.ts` | 29 | 321 (was 0) |

**render-dsd.ts** — Covers `escapeHtml`, `escapeAttr`, `escapeAttrValue`, `serializeAttributes`, `renderDSD` (all paths), L2 Nested DSD, XSS safety, DSD options (delegatesFocus/serializable/slotAssignment/customElementRegistry), pure-island layer, adapter protocol, and edge cases.

**island.ts** — Covers tag name validation, metadata markers (`__island`/`__tagName`/`__layer`), DSD opt-out, four upgrade strategies (eager/lazy/idle/visible), idempotent registration, `connectedCallback` wrapping, `getSSRProps`, and `lessBind`.

### Bug Fixes

- **runtime-shim consistency**: `serializeAttributes()` in `runtime-shim.ts` now uses `escapeAttrValue()` instead of `escapeAttr`, matching `render-dsd.ts`. Previously, null/undefined values were not handled consistently.
- **headExtras/headFragments XSS warnings**: Added `@security`/`@dangerous` JSDoc annotations. Runtime `console.warn` is emitted when injected content contains `<script>` tags.
- **Silent catch elimination**: 6 remaining silent catch blocks replaced with `console.debug`/`console.warn`, making errors observable. Affected files: `island.ts`, `render-dsd.ts`, `cli/build-ssg.ts`, `cli/build-client.ts`.

### Infrastructure

- **Pre-commit hooks**: `.githooks/pre-commit` runs `deno fmt --check` + `deno lint` + `deno check`. Enable with `deno task hooks:install`.
- **CI adapter-lit tests**: New `test-adapter-lit` job in test.yml.
- **CI publish gate**: publish.yml now requires `needs: [test]` — no publish without passing tests.
- **Cloudflare Pages migration**: Deployed from GitHub Pages to Cloudflare Pages (Connect GitHub mode). `main` → Production (lessjs.com), `dev` → Preview (auto-assigned URL per push).

## Breaking Changes

- **runtime-shim `serializeAttributes`**: Now handles null/undefined via `escapeAttrValue` instead of passing through `escapeAttr`. If you were relying on the old behavior of stringifying null, this will now output an empty string.
- **Silent catch → observable errors**: Code that previously swallowed errors silently will now log `console.warn` or `console.debug` with `[LessJS]` prefix. If your error monitoring treats these as noise, adjust your log filters.

## Full Test Suite

```
354 passed, 0 failed
```

## Version Strategy

See [ADR 0006: Version Strategy](https://lessjs.com/decisions/0006-version-strategy) for the full roadmap from v0.7 → v2.0.

**Next**: v0.8.0 — P1 feature improvements + Island Manifest + Blog development kickoff.

## Upgrade

```bash
# Update your project's dependency
deno run -A jsr:@lessjs/create

# Install pre-commit hooks (recommended)
deno task hooks:install
```
