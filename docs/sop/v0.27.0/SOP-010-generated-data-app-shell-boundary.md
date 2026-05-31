# SOP-010: Generated Data and App Shell Boundary

> Version: v0.27.0
> Status: READY FOR IMPLEMENTATION
> Date: 2026-05-31
> Owner: adapter-vite, content, i18n, ui, www
> ADR: ADR-0070
> Purpose: finish the SOP-009 data-virtual cleanup with the correct package/app
> boundary.

## Goal

Complete the workaround-chain cleanup without coupling `@lessjs/ui` to app
generated data.

The final state is:

- `www` route components render page content only.
- `www` route components do not hand-author `<less-layout>`.
- `www` route components do not hand-pass `locale`, `locales`, `nav-items`,
  `header-nav`, or `current-path`.
- `@lessjs/ui/less-layout` does not import generated data, content data, or
  virtual data modules.
- Generated app data is imported through `@lessjs/generated/*`.
- Package API subpaths such as `@lessjs/content/nav` are not remapped to app
  generated files.
- `adapter-vite` has one generated-data resolver used by dev, SSG, and client
  build paths.
- There are no hardcoded `www/app/data` paths in framework packages.

## Current Baseline

This SOP starts from the 2026-05-31 checkout after SOP-008/009 work.

Observed state:

- `deno task build` passes and generates 351 HTML files.
- The DSD report is generated with 322 pages and 0 render errors.
- `deno task graph:check` passes for 19 packages with no cycles.
- `deno task typecheck` fails in `packages/ui/src/less-layout.tsx` because
  `_navSections` and `_headerNavLinks` are typed as `unknown[]` but returned as
  `NavSection[]` and `HeaderNavLink[]`.
- `www/app` has 0 `_renderer.ts` files.
- `www/app/routes` has 52 `<less-layout>` occurrences.
- `www/app/routes` has 44 `locale=` and 44 `locales=` attributes.
- `www/app/routes` still imports generated blog data through
  `@lessjs/content/blog-data`.
- `build-ssg.ts` and `less-plugin.ts` still hardcode `www/app/data`.
- Client build still emits a `_virtual_less-nav-client` chunk.

Do not treat the green docs build as proof that SOP-009 is complete. The build
passes because the current virtual-data bridge still exists.

## Non-Goals

- Do not redesign the docs site.
- Do not rewrite the entry renderer as an AST/template generator in this SOP.
- Do not remove builder virtual modules used for generated entries or route
  types.
- Do not make `@lessjs/ui` depend on `@lessjs/content`, `@lessjs/i18n`, or
  `@lessjs/generated/*`.
- Do not bring back `window.__ROUTE_MANIFEST__`.
- Do not patch only `www` route pages while leaving framework contracts
  ambiguous.

## Phase 0: Stabilize the Current Gate

Purpose: make the current dirty baseline type-checkable before larger movement.

1. Fix the two type errors in `packages/ui/src/less-layout.tsx`.
   - Preferred temporary fix: type `_navSections` as `NavSection[] | undefined`.
   - Preferred temporary fix: type `_headerNavLinks` as
     `HeaderNavLink[] | undefined`.
   - Do not add new imports from content or generated data.
2. Run:

```text
deno task typecheck
deno task graph:check
deno task build
```

Exit criteria:

- `typecheck`, `graph:check`, and `build` pass.
- No new virtual module usage is introduced.

## Phase 1: Add the Generated Data Namespace

Purpose: split package APIs from app-generated data.

1. Add canonical generated-data specifiers:

```text
@lessjs/generated/nav
@lessjs/generated/blog-data
@lessjs/generated/i18n
```

2. Add one shared resolver implementation in `packages/adapter-vite/src`, for
   example:

```text
generated-data-resolver.ts
```

3. The resolver must accept app root and data directory options:

```typescript
interface GeneratedDataResolverOptions {
  root: string;
  dataDir?: string; // default: "app/data"
}
```

4. The resolver maps:

```text
@lessjs/generated/nav       -> <root>/<dataDir>/_generated-nav.ts
@lessjs/generated/blog-data -> <root>/<dataDir>/_generated-blog-data.ts
@lessjs/generated/i18n      -> <root>/<dataDir>/_generated-i18n-data.ts
```

5. Missing files must resolve to explicit typed fallback modules only during
   early dev/build startup. A missing generated file after content/i18n plugins
   have run should be reported as a clear framework error.

6. Add focused tests:

```text
packages/adapter-vite/__tests__/generated-data-resolver.test.ts
```

Test cases:

- resolves all three generated specifiers from root + default data dir.
- resolves from a custom data dir.
- does not resolve `@lessjs/content/nav`.
- does not resolve `@lessjs/content/blog-data`.
- does not resolve `@lessjs/i18n/data`.
- fallback module exports match the generated writer contracts.

Exit criteria:

- The generated namespace exists and is tested.
- No route code has been migrated yet.
- Existing build still passes.

## Phase 2: Replace Duplicated Generated-Data Resolution

Purpose: remove hardcoded data paths and duplicate resolver logic.

1. Use the shared generated-data resolver in `packages/adapter-vite/src/less-plugin.ts`.
2. Use the same resolver in `packages/adapter-vite/src/cli/build-ssg.ts`.
3. Use the same resolver in `packages/adapter-vite/src/cli/build-client.ts` if
   client build still needs generated-data stubs.
4. Remove direct `resolve(root, "www/app/data/...")` usage from framework code.
5. Remove direct `join(cwd, "www/app/data/...")` usage from framework code.
6. Keep temporary compatibility for old app-data aliases only if needed:

```text
@lessjs/content/nav
@lessjs/content/blog-data
@lessjs/i18n/data
```

Compatibility must be marked deprecated in comments and tests. New framework
code must use `@lessjs/generated/*`.

7. Update `www/deno.json` to add the generated namespace:

```json
{
  "imports": {
    "@lessjs/generated/nav": "./app/data/_generated-nav.ts",
    "@lessjs/generated/blog-data": "./app/data/_generated-blog-data.ts",
    "@lessjs/generated/i18n": "./app/data/_generated-i18n-data.ts"
  }
}
```

Do not remove old `www/deno.json` aliases until all route imports and framework
references are migrated.

Exit criteria:

- Framework packages contain no `www/app/data` string except tests that assert
  old behavior is absent.
- `deno task typecheck` passes.
- `deno task build` passes.

## Phase 3: Introduce the Framework App Shell

Purpose: move layout wiring out of route components.

1. Add framework-owned app-shell renderer support in `adapter-vite`.

The app shell may be implemented as:

- an auto-generated root renderer when content nav or i18n is configured, or
- a generated `_renderer`-equivalent module inside the virtual entry code.

It must compose with explicit user `_renderer.ts` files.

2. The generated app shell imports:

```typescript
import '@lessjs/ui/less-layout';
import { headerNav, navSections } from '@lessjs/generated/nav';
import { getDefaultLocale, locales } from '@lessjs/generated/i18n';
```

3. The app shell computes:

- current path from Hono context in dev and from `renderRoute()` options in SSG.
- locale from route options or URL prefix.
- locale list from generated i18n data.
- layout flags from route metadata.

4. The app shell wraps page content:

```html
<less-layout
  current-path="..."
  locale="..."
  locales="[...]"
  nav-items="[...]"
  header-nav="[...]"
>
  ...
</less-layout>
```

5. Attribute serialization must use the same escaping rules as the render
   pipeline. Do not concatenate unescaped JSON into HTML attributes.

6. Add route-level metadata support only for page-specific layout flags. For
   example:

```typescript
export const meta = {
  section: 'Home',
  label: 'Home',
  layout: { fullWidth: true },
};
```

This is allowed because it declares page semantics. It is not framework wiring.

7. Add tests in `entry-renderer.test.ts` or a new app-shell test:

- default shell wraps routes once.
- explicit user `_renderer.ts` still runs.
- shell and user renderer compose in deterministic order.
- SSG `renderRoute()` passes locale to the app shell.
- generated nav/i18n imports are present only in the app-shell module.
- `@lessjs/ui` generated code has no `@lessjs/generated/*` import.

Exit criteria:

- A route can render inside `<less-layout>` without the route component
  containing `<less-layout>`.
- Explicit user renderers still work.
- Build and typecheck pass.

## Phase 4: Migrate WWW Routes

Purpose: make `www` a consumer of framework layout instead of a layout owner.

1. For each `www/app/routes/**/*.tsx` page:
   - remove `import "@lessjs/ui/less-layout"` when it is used only for layout.
   - remove `<less-layout>` wrappers.
   - remove `locale=`, `locales=`, `current-path=`, `nav-items=`,
     `header-nav=`.
   - keep authored page content, examples, islands, and page-specific styles.
   - preserve route `tagName` exports.
   - move page-specific layout intent into `meta.layout` if needed.

2. Special cases:
   - homepage full-width behavior becomes `meta.layout.fullWidth = true`.
   - docs pages with sidebar use the default app shell.
   - pages that intentionally do not use the standard shell must opt out with
     route metadata, not by manually bypassing the framework in ad hoc ways.

3. Blog routes:
   - replace `@lessjs/content/blog-data` imports with
     `@lessjs/generated/blog-data`.
   - update comments that still mention `virtual:less-blog-data`.

4. i18n route helpers:
   - route code should not import app i18n data from `@lessjs/i18n/data`.
   - if app i18n data is needed, use `@lessjs/generated/i18n`.
   - package helpers remain imported from `@lessjs/i18n`.

Exit criteria:

The following commands return zero for route wiring:

```powershell
$files = Get-ChildItem www\app\routes -Recurse -Include *.ts,*.tsx
($files | Select-String -Pattern '<less-layout' -SimpleMatch).Count
($files | Select-String -Pattern 'locale=' -SimpleMatch).Count
($files | Select-String -Pattern 'locales=' -SimpleMatch).Count
($files | Select-String -Pattern 'nav-items=' -SimpleMatch).Count
($files | Select-String -Pattern 'header-nav=' -SimpleMatch).Count
($files | Select-String -Pattern 'current-path=' -SimpleMatch).Count
```

## Phase 5: Remove Data Virtual Modules

Purpose: delete the SOP-009 data-virtual workaround chain.

Remove these data virtual contracts:

```text
virtual:less-nav
virtual:less-blog-data
virtual:less-i18n-data
```

Expected deletion/update points:

- `packages/protocols/src/virtual-ids.ts`
- `packages/adapter-vite/src/cli/build-client.ts`
- `packages/adapter-vite/src/cli/build-ssg.ts`
- `packages/adapter-vite/src/entry-renderer.ts`
- `packages/adapter-vite/src/less-plugin.ts`
- `packages/adapter-vite/src/phase-context.ts`
- `packages/content/src/blog-data-plugin.ts`
- `packages/content/src/index.ts`
- `packages/i18n/src/i18n-data-plugin.ts`
- `packages/i18n/src/index.ts`
- comments and tests that describe data virtual modules as current behavior

Do not delete builder virtual modules:

```text
virtual:less-hono-entry
virtual:less-build-trigger
virtual:less-client-entry
virtual:less-ssg-entry
virtual:less-routes
```

Exit criteria:

```powershell
Get-ChildItem packages,www\app -Recurse -Include *.ts,*.tsx |
  Select-String -Pattern 'virtual:less-nav','virtual:less-blog-data','virtual:less-i18n-data'
```

returns no product-code matches.

## Phase 6: Remove Old App-Data Aliases

Purpose: finish the namespace split.

1. Remove old generated-data remaps from `www/deno.json`:

```text
@lessjs/content/nav
@lessjs/content/blog-data
@lessjs/i18n/data
```

2. Keep package import maps in root/package `deno.json` files aligned with real
   package exports.
3. Remove compatibility branches in the generated-data resolver.
4. Add a test that `@lessjs/content/nav` is not treated as app-generated data.

Exit criteria:

- `www/deno.json` only maps `@lessjs/generated/*` for generated data.
- `@lessjs/content/*` package subpaths keep their package meaning.
- No generated-data resolver handles package API specifiers.

## Verification

Run focused tests first:

```text
deno test packages/adapter-vite/__tests__/generated-data-resolver.test.ts --allow-read --allow-write --allow-env
deno test packages/adapter-vite/__tests__/ssg-package-resolver.test.ts --allow-read --allow-net
deno test packages/adapter-vite/__tests__/entry-renderer.test.ts --allow-read --allow-write --allow-env
deno test packages/adapter-vite/__tests__/less-plugin.test.ts --allow-read --allow-write --allow-env
deno test packages/content/__tests__ --allow-read --allow-write --allow-env
deno test packages/i18n --allow-read --allow-write --allow-env
deno test packages/ui/__tests__ --allow-read --allow-write --allow-env
```

Then run release gates:

```text
deno task fmt:check
deno task lint
deno task typecheck
deno task graph:check
deno audit
deno task test
deno task build
deno task test:e2e
```

Required grep gates:

```powershell
Get-ChildItem packages,www\app -Recurse -Include *.ts,*.tsx |
  Select-String -Pattern 'virtual:less-nav','virtual:less-blog-data','virtual:less-i18n-data'

Get-ChildItem packages -Recurse -Include *.ts,*.tsx |
  Select-String -Pattern 'www/app/data'

Get-ChildItem packages\ui -Recurse -Include *.ts,*.tsx |
  Select-String -Pattern '@lessjs/content/nav','@lessjs/generated/nav','virtual:less-nav'

Get-ChildItem www\app\routes -Recurse -Include *.ts,*.tsx |
  Select-String -Pattern '<less-layout','locale=','locales=','nav-items=','header-nav=','current-path='
```

All four grep gates must return zero product-code matches.

Required build observations:

- SSG still generates localized pages for all configured locales.
- Search index still exists at `www/public/search-index.json`.
- DSD report has 0 render errors.
- Client bundle does not include `_virtual_less-nav-client`.
- Theme, search, i18n switch, and SPA navigation Playwright tests pass.

## Exit Criteria

SOP-010 is complete only when:

- `deno task typecheck` passes.
- `deno task graph:check` passes.
- `deno task build` passes.
- `deno task test:e2e` passes.
- route wiring grep gates are zero.
- data virtual grep gates are zero.
- framework hardcoded `www/app/data` grep gate is zero.
- `@lessjs/ui` has no app data imports.
- `www/deno.json` uses `@lessjs/generated/*` for app generated data.
- SOP-009 can be updated to point to this SOP as the corrected completion path.

## Handoff Notes

This SOP intentionally corrects SOP-009 rather than continuing its original P0
plan. The failed plan tried to solve route/layout/data duplication by moving
app data into `@lessjs/ui`. The correct plan moves data composition upward into
the app shell boundary.

If a future implementation hits resolver errors, first check whether the code
has reintroduced package/app specifier overloading. Do not add another virtual
data module as a workaround.
