# SOP-009: v0.29.3 CodeQL Alert Resolution

> Version: v0.29.3
> Date: 2026-06-03
> Status: Completed
> Output: 5 real CodeQL alerts resolved, 19 packages bumped to 0.29.3

## Summary

Audit GitHub CodeQL security scanning results. 16 open alerts found. 5 confirmed real issues resolved. 11 confirmed false positives dismissed.

## Scope

- Fix `hasError` dead assignment in render-dsd.ts catch path.
- Fix type comparison quirk in `describeRenderValue`.
- Mark innerHTML trust boundaries explicitly with `trustRenderHtml`.
- Delete unused `pkgRoute` variable.
- Bump all 19 packages to 0.29.3.

## Execution

### 1. render-dsd.ts hasError

```bash
# render-dsd.ts:350
hasError: true  →  hasError: hasError
```

### 2. render-dsd.ts type comparison

```bash
# render-dsd.ts:459
typeof value !== 'object' || value === null  →  value === null || typeof value !== 'object'
```

### 3. dsd-element.ts trust boundary

```bash
# dsd-element.ts:544 (renderErrorFallback)
this.shadowRoot.innerHTML = fallback  →  this.shadowRoot.innerHTML = trustRenderHtml(fallback)

# dsd-element.ts:664 (renderIntoShadowRoot)
this.shadowRoot!.innerHTML = result  →  this.shadowRoot!.innerHTML = trustRenderHtml(result)
```

### 4. registry component dead variable

```bash
# registry/[package]/[component].tsx:405
const pkgRoute = ...  →  deleted
```

### 5. Package bump

```bash
# All 19 packages: 0.29.x → 0.29.3
# version.ts: v0.29.2 → v0.29.3
```

## Verification

- `deno task fmt:check` — passed
- `deno task lint` — passed
- `deno task test` — 1317 passed
- `deno task typecheck` — 19/19
- `deno task graph:check` — passed
