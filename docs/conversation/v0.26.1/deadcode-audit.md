# Dead Code Audit — LessJS v0.26.1

**Date**: 2026-05-30\
**Auditor**: deadcode-auditor\
**Scope**: `www/app/routes/**`, `www/app/islands/**`, `www/app/components/**`, `packages/ui/src/**`, `packages/core/src/**`

---

## 1. Obsolete `_xxx()` Method References

### Status: CLEAN (source code only)

The following deprecated methods only appear in **vendor copies**, **docs/ADRs**, and **coverage files** — NOT in active source code outside `dsd-element.ts`:

| Method                          | Source Code Location                                 | Comment                                 |
| ------------------------------- | ---------------------------------------------------- | --------------------------------------- |
| `_disposeTemplateRuntime()`     | Only in `vendor/jsr.io/@openelement/core/0.23.6/`         | Vendor copy, not current code           |
| `_disposeSignalSubscriptions()` | Only in vendor + docs                                | Removed in v0.26.1                      |
| `_templateAbortController`      | Only in vendor + docs                                | Replaced by `_scopeDispose`             |
| `_signalUnsubscribers`          | Only in vendor + docs                                | Unused array removed                    |
| `_bindCurrentRenderTemplate()`  | Only in `vendor/jsr.io/@openelement/core/0.23.6/`         | Gone from current code                  |
| `_hydrateEvents()`              | In adapter packages (lit/vanilla/react) + test files | **Still active** in adapters — NOT dead |

### Action: LOW

- `dsd-element.ts:402-404`: Stale comment referencing removed methods. Remove or shorten.
- All other references are in docs/ADR/vendor — expected archaelogical context.

---

## 2. Duplicate CSS Classes

### CRITICAL: `.nav-row` and `.nav-link` defined in BOTH `page-styles.ts` AND route files

**Canonical definition**: `www/app/components/page-styles.ts` lines 187-208

**Duplicate definitions in route files**:

| File                                   | Lines   | Description                                |
| -------------------------------------- | ------- | ------------------------------------------ |
| `routes/changelog.tsx`                 | 138-152 | `.nav-row` + `.nav-link` in `routeSheet`   |
| `routes/architecture/architecture.tsx` | 234-253 | `.nav-row` + `.nav-link` in `pageSheet`    |
| `routes/guide/getting-started.tsx`     | 31-44   | `.nav-row` + `.nav-link` in `routeSheet`   |
| `routes/roadmap.tsx`                   | 192-204 | `.nav-row` + `.nav-link` in `routeSheet`   |
| `routes/blog/[slug].tsx`               | 47      | `.nav-row` margin override in `routeSheet` |

**`.container` partial duplicates** (page-styles.ts defines it, route files add overrides):

| File                | Issue                                       |
| ------------------- | ------------------------------------------- |
| `routes/404.tsx:46` | `.container` redefined with different rules |

### Impact

- Changelog/GettingStarted/Roadmap routeSheet `.nav-row`/`.nav-link` rules **override** page-styles.ts rules when both are loaded, causing inconsistent nav styling across pages
- Each duplicate adds ~10-20 lines of CSS per file

### Action: HIGH

1. Remove all `.nav-row`/`.nav-link` definitions from route files
2. Ensure page-styles.ts is imported in ALL route pages
3. Verify visual consistency across all pages after change

---

## 3. Unused / Duplicate Imports

### 3a. Double Import (CRITICAL)

| File                               | Lines | Issue                                                    |
| ---------------------------------- | ----- | -------------------------------------------------------- |
| `routes/guide/getting-started.tsx` | 9-10  | `import '../../islands/less-toc.tsx'` declared **twice** |

Line 9 and line 10 are identical duplicate imports. One should be removed.

### 3b. Possible Unused Import

| File                     | Import                                              | Suspicion                                                     |
| ------------------------ | --------------------------------------------------- | ------------------------------------------------------------- |
| `routes/blog/[slug].tsx` | `import { navSections } from '@openelement/content/nav'` | Used only as `const nav = navSections` — can be used directly |

### 3c. Missing `pageStyles` Import

These routes use `.nav-row`/`.nav-link` in their inline CSS but DON'T import `pageStyles`:

| File                               | Has pageStyles import? |
| ---------------------------------- | ---------------------- |
| `routes/changelog.tsx`             | YES (line 14)          |
| `routes/guide/getting-started.tsx` | NO                     |
| `routes/roadmap.tsx`               | Need to check          |
| `routes/404.tsx`                   | NO                     |
| `routes/apilist.tsx`               | NO                     |
| `routes/hub/index.tsx`             | Need to check          |
| `routes/docs/index.tsx`            | Need to check          |

### Action: HIGH

- Fix double import in `getting-started.tsx`
- Audit all routes for `pageStyles` import consistency

---

## 4. Stale Version Comments

### 4a. Obsolete Comments in Active Code

| File                               | Line    | Comment                                                                                   | Issue                                                          |
| ---------------------------------- | ------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `packages/core/src/dsd-element.ts` | 402-404 | `// v0.26.1: effectScope replaces _disposeTemplateRuntime + _disposeSignalSubscriptions.` | References methods already removed — this comment is now noise |

### 4b. Old Version Annotations in Route Files (INFORMATIONAL)

These are version tags in documentation content — not dead code, but stale:

- `routes/architecture/architecture.tsx:312` — `v0.23.0` displayed as current
- `routes/roadmap.tsx:254` — says `v0.23.0` is current
- `routes/roadmap.tsx:289` — shows `v0.26.x` as planned

### Action: LOW

- Remove `dsd-element.ts:402-404` comment
- Update roadmap display if desired (content, not code)

---

## 5. Template Literals vs JSX

### 5a. Routes Still Using `return \`...\`` (template strings)

**21 files, ~40 render functions** still use template literal strings instead of JSX:

| File                                            | Count                        | Locale Pattern                                      |
| ----------------------------------------------- | ---------------------------- | --------------------------------------------------- |
| `routes/404.tsx`                                | 1                            | template literal                                    |
| `routes/apilist.tsx`                            | 2 (zh + en)                  | template literal + **hardcoded** `locale="zh"/"en"` |
| `routes/changelog.tsx`                          | 1                            | template literal                                    |
| `routes/roadmap.tsx`                            | 1                            | template literal                                    |
| `routes/hub/index.tsx`                          | 1                            | template literal                                    |
| `routes/docs/index.tsx`                         | 1                            | template literal                                    |
| `routes/blog/index.tsx`                         | 2 (zh + en)                  | template literal                                    |
| `routes/architecture/architecture.tsx`          | 1                            | template literal                                    |
| `routes/architecture/comparison.tsx`            | 1                            | template literal                                    |
| `routes/architecture/dsd.tsx`                   | 2 (zh + en)                  | template literal                                    |
| `routes/architecture/islands.tsx`               | 2 (zh + en)                  | template literal                                    |
| `routes/architecture/package-compatibility.tsx` | 2 (zh + en)                  | template literal                                    |
| `routes/architecture/standards-registry.tsx`    | 2 (zh + en)                  | template literal                                    |
| `routes/guide/architecture.tsx`                 | 1                            | template literal                                    |
| `routes/guide/core-concepts.tsx`                | 2 (zh + en)                  | template literal                                    |
| `routes/guide/getting-started.tsx`              | 2 (zh + en)                  | template literal                                    |
| `routes/guide/islands-and-ssr.tsx`              | 2 (zh + en)                  | template literal                                    |
| `routes/guide/routing-and-data.tsx`             | 2 (zh + en)                  | template literal                                    |
| `routes/registry/index.tsx`                     | 2 (zh + en + search results) | template literal                                    |
| `routes/registry/[package].tsx`                 | 3 (zh + en + json)           | template literal                                    |
| `routes/registry/[package]/[component].tsx`     | 2 (wrap + detail)            | template literal                                    |

### 5b. Routes Using JSX (good)

| File                                        | Count |
| ------------------------------------------- | ----- |
| `routes/index/index.tsx`                    | 1     |
| `routes/blog/[slug].tsx`                    | 4     |
| `routes/architecture/benchmark.tsx`         | 2     |
| `routes/architecture/design-system.tsx`     | 2     |
| `routes/architecture/islands-deep.tsx`      | 2     |
| `routes/contributing.tsx`                   | 2     |
| `routes/guide/api.tsx`                      | 2     |
| `routes/guide/configuration.tsx`            | 2     |
| `routes/guide/deployment.tsx`               | 2     |
| `routes/guide/error-handling.tsx`           | 2     |
| `routes/guide/testing.tsx`                  | 2     |
| `routes/registry/[package]/[component].tsx` | 3     |

**Ratio**: ~40 template literal renders vs ~28 JSX renders — **more template literals than JSX**

### Impact

- Template literals don't benefit from JSX type checking
- Template literals can't use JSX expressions (`{variable}`)
- Each template literal page embeds `<open-layout>` as a raw HTML string with `${JSON.stringify(...)}` for all props

### Action: MEDIUM

- Migrate all template literal renders to JSX (ADR-0057 migration incomplete)
- Priority: pages with hardcoded locale (apilist.tsx), then zh/en dual pages

---

## 6. `_esc()` Utility Usage

### Definition

`packages/ui/src/shared/escape.ts:12` — HTML-escape utility function

### Usage (all legitimate)

| File                                 | Lines                                  | Usage Count |
| ------------------------------------ | -------------------------------------- | ----------- |
| `packages/ui/src\/open-layout.tsx`    | 693, 694, 702, 775, 800, 820, 835, 883 | 8 uses      |
| `packages/ui/src\/open-step-card.tsx` | 95, 102                                | 2 uses      |
| `packages/ui/src\/open-input.tsx`     | 139, 163                               | 2 uses      |
| `packages/ui/src\/open-dialog.tsx`    | 124                                    | 1 use       |
| `packages/ui/src\/open-callout.tsx`   | 73                                     | 1 use       |

### Note

`routes/changelog.tsx:247-252` defines its own local `esc()` function instead of using the shared `_esc()` utility.

### Action: LOW

- Consider having changelog.tsx use shared `_esc()` instead of local `esc()`

---

## 7. Hard-coded Locale

### Files with hard-coded `locale='zh'` or `locale='en'` (should use `_getLocale()`)

| File                                        | Line          | Value         | Context                                       |
| ------------------------------------------- | ------------- | ------------- | --------------------------------------------- |
| `routes/apilist.tsx`                        | 43            | `locale="zh"` | `_renderZh()` — should use `_getLocale('zh')` |
| `routes/apilist.tsx`                        | 156           | `locale="en"` | `_renderEn()` — should use `_getLocale('en')` |
| `routes/architecture/benchmark.tsx`         | 57            | `locale='zh'` | `_renderZh()` — should use `_getLocale('zh')` |
| `routes/registry/[package].tsx`             | 234           | `locale="en"` | Template literal — hardcoded                  |
| `routes/registry/[package].tsx`             | 248           | `locale="en"` | Template literal — hardcoded                  |
| `routes/registry/[package]/[component].tsx` | 406, 431, 467 | `locale='en'` | JSX render — hardcoded                        |
| `routes/registry/index.tsx`                 | 426           | `locale="en"` | Template literal — hardcoded                  |
| `routes/index/index.tsx`                    | 177           | `locale='en'` | JSX — hardcoded default                       |

### Already Correct

| File                                  | Pattern                                           |
| ------------------------------------- | ------------------------------------------------- |
| `routes/changelog.tsx:270`            | `locale="${this._getLocale('zh')}"`               |
| `routes/guide/getting-started.tsx:60` | `locale="${this._getLocale('zh')}"`               |
| `routes/blog/[slug].tsx`              | `locale={loc}` where `loc = this._getLocale(...)` |

### Impact

- Pages with hardcoded locale can't properly respond to URL path-based locale switching
- `index/index.tsx` uses `this._getLocale('en') === 'zh'` for content but hardcodes `locale='en'` — inconsistent

### Action: MEDIUM

- Fix all hardcoded `locale="zh"/"en"` to use `this._getLocale()`
- Ensure `locales` prop is also consistent (some use `["en","zh"]`, some use `['en']`)

---

## 8. `JSON.stringify` in `render()`

### EVERY route page uses JSON.stringify for nav/layout props

**Total usage count**: 130+ `JSON.stringify()` calls across ALL route files

All pages pass nav data to `<open-layout>` via `JSON.stringify()`:

```js
nav-items='${JSON.stringify(navSections)}'
header-nav='${JSON.stringify(headerNav)}'
locales='${JSON.stringify(['en', 'zh'])}'
```

In JSX pages:

```jsx
navItems={JSON.stringify(navSections)}
headerNav={JSON.stringify(headerNav)}
locales={JSON.stringify(['en', 'zh'])}
```

### Identified Anti-patterns

1. **Inconsistent attribute naming**: Template-literal pages use `nav-items`/`header-nav` (kebab-case); JSX pages use `navItems`/`headerNav` (camelCase). The `<open-layout>` component must handle both.
2. **Repetitive locales stringify**: `JSON.stringify(['en', 'zh'])` appears in nearly every file — could be a shared constant.
3. **benchmark.tsx line 57**: Uses manual quoting `locales='[&quot;en&quot;,&quot;zh&quot;]'` instead of `JSON.stringify`

### Action: LOW (pattern is consistent, just heavy)

- Consider a shared `layoutProps()` helper that pre-JSON-encodes nav sections
- Standardize attribute naming (kebab vs camel)

---

## 9. Empty Style Blocks / Unused StyleSheet Instances

### Status: CLEAN

- No empty `<style>` blocks found
- No `<style></style>` empty tags
- All `new StyleSheet()` instances are used via `static styles = [...]`

All StyleSheet instances have `replaceSync()` calls with actual CSS content.

---

## 10. `onDsdHydrated()` / `onCsrRendered()` Empty Overrides

### `packages/core/src/dsd-element.ts:377, 389`

```ts
protected onDsdHydrated(): void {}
protected onCsrRendered(): void {}
```

These are **intentional empty hook methods** in the base class — not dead code. Subclasses override them as needed. This is the Template Method pattern.

### Check: Are they overridden?

| File                       | Overrides                                |
| -------------------------- | ---------------------------------------- |
| `islands/home-console.tsx` | Overrides `onDsdHydrated()` — legitimate |
| `islands/less-search.tsx`  | Overrides `onDsdHydrated()` — legitimate |
| Other islands              | Need to verify                           |

### Action: NO ACTION — framework design pattern

---

## 11. `_getLocale()` Check Pattern

Many route files use pattern:

```ts
(this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
```

The argument `'zh'` or `'en'` passed to `_getLocale()` is the **default value** if no locale is set. This means:

- `this._getLocale('zh') === 'en'` — checks if current locale is 'en', defaults to 'zh'
- `this._getLocale('en') === 'zh'` — checks if current locale is 'zh', defaults to 'en'

Two patterns exist across routes:

1. `this._getLocale('zh') === 'en'` — used by: changelog.tsx, 404.tsx, blog/index.tsx, blog/[slug].tsx, architecture/architecture.tsx, apilist.tsx, etc.
2. `this._getLocale('en') === 'zh'` — used by: index/index.tsx, architecture/benchmark.tsx

### Impact

The first arg is the **default** — pattern 1 defaults Chinese ("zh"), pattern 2 defaults English ("en"). Both work but are inconsistent.

---

## 12. Additional Findings

### 12a. Inconsistent `<open-layout>` Attribute Naming

Template-literal (kebab-case):

```
nav-items='${...}'  header-nav='${...}'  current-path="/..."
```

JSX (camelCase):

```jsx
navItems={...}  headerNav={...}  currentPath="/..."
```

`index/index.tsx` (mixed!):

```jsx
locale='en' locales='["en","zh"]' nav-items={JSON.stringify(navSections)} header-nav={JSON.stringify(headerNav)} current-path="/"
```

Note: `index.tsx` uses JSX with kebab-case attribute names — unusual.

### 12b. `benchmark.tsx` Special Issues

```tsx
// Line 27: defaults to 'zh' and checks _getLocale('zh') === 'zh' (always true!)
return this._getLocale('zh') === 'zh' ? this._renderZh() : this._renderEn();

// Line 57: Hardcoded locale, manual HTML-encoded locales
<open-layout ... locale='zh' locales='[&quot;en&quot;,&quot;zh&quot;]' ...>
```

**Bug**: `this._getLocale('zh') === 'zh'` will **always** be true because the default is 'zh'. The English version can never be rendered.

---

## Summary: Counts by Category

| #   | Category                               | Count                              | Severity |
| --- | -------------------------------------- | ---------------------------------- | -------- |
| 1   | Deprecated method references in source | 0 active, 1 stale comment          | LOW      |
| 2   | Duplicate CSS (`.nav-row`/`.nav-link`) | 5 files duplicating page-styles.ts | **HIGH** |
| 3a  | Double imports                         | 1 (getting-started.tsx)            | **HIGH** |
| 3b  | Missing pageStyles import              | ~5 files                           | MEDIUM   |
| 4   | Stale version comments in code         | 1 (dsd-element.ts)                 | LOW      |
| 5   | Template literals vs JSX               | ~40 render functions in 21 files   | MEDIUM   |
| 6   | `_esc()` usage                         | 14 uses across 5 UI components     | INFO     |
| 7   | Hard-coded locale                      | 8 locations across 5 files         | MEDIUM   |
| 7   | benchmark.tsx locale bug               | 1 (always renders zh)              | **HIGH** |
| 8   | JSON.stringify patterns                | 130+ calls, all routes             | LOW      |
| 9   | Empty style blocks                     | 0                                  | CLEAN    |
| 10  | `onDsdHydrated`/`onCsrRendered`        | 2 base class hooks                 | CLEAN    |
| 11  | `_getLocale()` inconsistency           | 2 patterns used                    | LOW      |
| 12b | Inconsistent attribute naming          | Mixed kebab/camel                  | LOW      |

---

## Cleanup Priority

### P0 — Fix Immediately

1. **benchmark.tsx locale bug** (line 27): `_getLocale('zh') === 'zh'` always true — en path unreachable
2. **getting-started.tsx double import** (line 9-10): Remove duplicate

### P1 — High Priority

3. **Remove duplicate `.nav-row`/`.nav-link` CSS** from all 5 route files
4. **Fix hard-coded locale** in apilist.tsx, benchmark.tsx, registry files
5. **Add missing `pageStyles` imports** to routes that use `.nav-row`/`.nav-link`

### P2 — Medium Priority

6. **Migrate template-literal renders to JSX** (completes ADR-0057 migration)
7. **Standardize `_getLocale()` check pattern** across all routes
8. **Standardize `<open-layout>` attribute naming** (kebab vs camel)

### P3 — Low Priority

9. **Remove stale comment** in `dsd-element.ts:402-404`
10. **Refactor `JSON.stringify` repetition** into a shared helper
11. **Have changelog.tsx use shared `_esc()`** instead of local `esc()`
