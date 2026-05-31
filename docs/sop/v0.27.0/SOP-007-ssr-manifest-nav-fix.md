# SOP-007: SSR Manifest-Aware Nav, i18n, Search Recovery

> Version: v0.27.0 / v0.28.1
> Status: Diagnosis Complete → Implementation
> Date: 2026-05-31
> Trigger: www deployed — header nav gone, sidebar gone, i18n gone, search styling broken

---

## Root Cause Analysis

### The Core Problem

`_manifestData()` reads `globalThis.__ROUTE_MANIFEST__`. This global is injected
as a `<script>` tag during SSG **post-processing** — _after_ SSR rendering.

```
SSR timeline:
  1. renderToString(less-layout.render())
  2. _headerNav() → _manifestData('headerNav') → null     ← ❌ not yet injected
  3. _rawNavItems() → _manifestData('navSections') → null  ← ❌ not yet injected
  4. Router.#l() → getAttribute('locales') → null          ← ❌ attribute deleted
  5. SSR HTML: ZERO header-nav, ZERO sidebar, ZERO lang-switch

Browser timeline:
  6. DSD creates shadow DOM ← template has no nav/sidebar
  7. <script>window.__ROUTE_MANIFEST__ = {...}</script> ← now available!
  8. connectedCallback() fires → no re-render trigger
  9. Router has no locales → defaults to ['en'] → no i18n switch
```

### Three Faults, One Root

| Fault               | Direct Cause                                                            | Phase  |
| ------------------- | ----------------------------------------------------------------------- | ------ |
| Header nav vanished | `_manifestData()` returns null during SSR                               | SSR    |
| Sidebar vanished    | `_manifestData()` returns null during SSR                               | SSR    |
| i18n gone           | `Router.#l()` reads `locales` attribute (deleted), doesn't use manifest | Client |
| Search style broken | TBD during implementation                                               | —      |

### Evidence

- DSD template in `www/dist/index.html`: 0 occurrences of `class="header-nav"` HTML content
- `locales` attribute absent from `<less-layout>` in SSR output
- 353 HTML files contain `__ROUTE_MANIFEST__` (injection works post-SSR)
- CSS rules for `.header-nav` exist — styling is present, HTML is not

---

## Fix Strategy

### Phase 1: SSR Manifest Availability (fixes nav + sidebar)

**Problem**: `_manifestData()` reads `globalThis.__ROUTE_MANIFEST__` which doesn't
exist during SSR rendering.

**Fix**: Read the manifest file in the SSR server entry and set
`globalThis.__ROUTE_MANIFEST__` **before** rendering each page.

**Files**:

- `packages/adapter-vite/src/cli/build-ssg.ts` — generate the SSR entry with manifest import
- OR: modify the SSR render pipeline to inject manifest before renderToString()

**Approach A (preferred)**: Add a manifest preload to the SSR server entry.
The SSR server (`www/dist/server/entry.js`) is generated during build. We can
make it import and set `globalThis.__ROUTE_MANIFEST__` before any component renders.

**Approach B (simpler)**: Modify `build-ssg.ts` to read the manifest file and
pass it to the SSR rendering context. The render pipeline already has a
`data-ssr-props` mechanism — we can inject nav data there.

**Decision**: Approach B. `data-ssr-props` is already the SSR data bridge.
Extend it to include `navSections`, `headerNav`, `locales`, `defaultLocale`.

### Phase 2: Router Locale Awareness (fixes i18n)

**Problem**: `Router.#l()` reads `locales` property/attribute but doesn't
fall back to manifest.

**Fix**: `Router.#l()` adds `_manifestData('locales')` as a final fallback.

**Files**:

- `packages/router/src/client-router.ts` — `#l()` method
- `packages/ui/src/less-layout.tsx` — connectedCallback locale logic

### Phase 3: Search Styling Investigation

**Problem**: Search shows results but styling is broken.

**Investigation steps**:

1. Check if search component CSS is in the DSD template
2. Check if CSS bundle includes search styles
3. Check if search component is properly defined and rendered

### Phase 4: E2E Enrichment

Add Playwright tests for:

1. Header nav renders on all doc pages
2. Sidebar renders on docs pages (not home)
3. Language switch renders and works
4. Search opens and displays results with correct styling

---

## Implementation Steps

### Step 1: SSR data injection

```ts
// packages/adapter-vite/src/cli/build-ssg.ts
// During SSR render, read manifest and inject into render context
```

### Step 2: Router locale fallback

```ts
// packages/router/src/client-router.ts — #l()
#l(): string[] {
  // ... existing attribute parsing ...
  // NEW: fallback to manifest
  if (!raw || (Array.isArray(raw) && raw.length <= 1)) {
    try {
      const m = (globalThis as any).__ROUTE_MANIFEST__;
      if (m?.locales?.length > 0) return m.locales;
    } catch {}
  }
  return ['en'];
}
```

### Step 3: Rebuild and verify

```bash
deno fmt --check
deno lint
deno task build
grep -c "header-nav" www/dist/index.html | grep -v CSS
```

### Step 4: E2E tests

```ts
// www/e2e/header-nav.spec.ts — new
// www/e2e/sidebar.spec.ts — new
// www/e2e/i18n-locale.spec.ts — enhance
// www/e2e/search.spec.ts — enhance with style checks
```

---

## Acceptance Criteria

- [ ] `www/dist/index.html` DSD template contains `class="header-nav"` HTML content
- [ ] `www/dist/index.html` DSD template contains `class="docs-sidebar"` HTML content
- [ ] Language switch renders on `/` and `/zh/`
- [ ] Router correctly resolves `locales` from manifest
- [ ] Search renders with correct styling
- [ ] All E2E tests pass
- [ ] `deno task build` passes
- [ ] 0 hand-written route wiring (navItems/headerNav/currentPath)
- [ ] 0 hand-written locale attributes on route pages

---

## Rollback Plan

If SSR manifest injection causes issues:

1. Revert the SSR data injection
2. Use client-side re-render fallback: `requestReactiveUpdate()` in
   `connectedCallback()` when manifest is available but attributes are missing.
   This causes a brief layout shift but works as a safety net.
