# Dead Code Hunt Report

> v0.27.0 migration audit | deadcode-hunter | 2026-05-30

---

## Summary

| Category                 | Count     | Bundle Impact |
| ------------------------ | --------- | ------------- |
| DELETE (zero references) | 7 islands | ~191 KB       |
| MIGRATE (wrong imports)  | 1 route   | n/a           |
| KEEP (legitimately used) | 15 items  | verified      |
| Content orphans          | 0         | n/a           |
| Duplicates               | 1 pair    | 1.9 KB        |

---

## 1. DELETE — Islands with Zero Route Imports

These files exist in `www/app/islands/` but are **never imported by any route**.\
The build system auto-discovers them and still bundles them into client JS, wasting bandwidth.

### 1.1 demo-idle.ts

- **File**: `www/app/islands/demo-idle.ts`
- **Size**: 26 lines
- **Bundle**: embedded in shared `island-demo-idle-*.js` chunk
- **Status**: Pure demo, never used in any route. Demonstrates `client:idle` strategy (`defineIsland`).
- **Action**: DELETE

### 1.2 demo-load.ts

- **File**: `www/app/islands/demo-load.ts`
- **Size**: 26 lines
- **Bundle**: embedded in shared chunk
- **Status**: Pure demo for `client:load` strategy. Zero route references.
- **Action**: DELETE

### 1.3 demo-only.ts

- **File**: `www/app/islands/demo-only.ts`
- **Size**: 26 lines
- **Bundle**: `island-demo-only-*.js`
- **Status**: Pure demo for `client:only` strategy. Zero route references.
- **Action**: DELETE

### 1.4 demo-visible.ts

- **File**: `www/app/islands/demo-visible.ts`
- **Size**: 26 lines
- **Bundle**: `island-demo-visible-*.js`
- **Status**: Pure demo for `client:visible` strategy. Zero route references.
- **Action**: DELETE

### 1.5 media-chrome-showcase.ts [BLOAT]

- **File**: `www/app/islands/media-chrome-showcase.ts`
- **Size**: 147 lines
- **Bundle**: `island-media-chrome-showcase-*.js` — **175 KB** (exceeds 50 KB budget)
- **Dependencies**: `@openelement/adapter-vanilla`, dynamic import of `media-chrome` library
- **Status**: SSR=false client-only showcase. Zero route imports. This is purely a demo that loads the entire `media-chrome` library. It's the **largest single island** in the client bundle. Not used in any user-facing page.
- **Action**: DELETE — saves 175 KB from every client download

### 1.6 react-showcase.ts

- **File**: `www/app/islands/react-showcase.ts`
- **Size**: 168 lines
- **Bundle**: `island-react-showcase-*.js` — **12 KB**
- **Dependencies**: `react`, `@openelement/adapter-react`
- **Status**: React integration demo. Zero route imports. No user-facing page uses it.
- **Action**: DELETE — saves 12 KB + removes React adapter overhead

### 1.7 counter-island.tsx

- **File**: `www/app/islands/counter-island.tsx`
- **Size**: 91 lines
- **Bundle**: `island-counter-island-*.js` — **1.9 KB**
- **Dependencies**: `@openelement/core`, `@openelement/signals`, `@openelement/style-sheet`
- **Status**: The `routes/guide/getting-started.tsx` route defines its OWN inline `CounterIsland` class (line 147-161) instead of importing this island. The island file is auto-discovered and bundled but never used. The getting-started route serves as documentation — showing the code inline.
- **Duplicate**: Two `counter-island` implementations exist:
  1. `www/app/islands/counter-island.tsx` — reactive DSD with signals
  2. `routes/guide/getting-started.tsx:147-161` — inline class, demo only
- **Recommendation**: DELETE the island file. If the route ever needs the reactive counter, import it — but currently it just shows documentation code.

---

## 2. MIGRATE — Wrong Import Paths

### 2.1 routes/architecture/islands.tsx — @openelement/runtime import in documentation

- **File**: `www/app/routes/architecture/islands.tsx`
- **Line**: 122 (inside a `<open-code-block>` code example)
- **Current**:
  ```ts
  import { DsdElement, html, signal, StyleSheet } from '@openelement/runtime';
  ```
- **Should be**:
  ```ts
  import { DsdElement, html } from '@openelement/core';
  import { StyleSheet } from '@openelement/style-sheet';
  import { signal } from '@openelement/signals';
  ```
- **Context**: This is rendered as documentation in a code block on the "Islands" architecture page. Users reading the docs see the deprecated `@openelement/runtime` import path. While it's not functional code, it's misleading documentation that should be updated.
- **Action**: Update the code example to use correct import paths.

---

## 3. KEEP — Legitimately Used

### 3.1 Islands (imported by routes)

| Island                  | Imported By                                      | Tag                   |
| ----------------------- | ------------------------------------------------ | --------------------- |
| `home-console.tsx`      | `routes/index/index.tsx` (homepage)              | `<home-console>`      |
| `less-search.tsx`       | `routes/404.tsx`, `changelog.tsx`, `roadmap.tsx` | `<less-search>`       |
| `less-toc.tsx`          | `routes/guide/getting-started.tsx`               | `<less-toc>`          |
| `reactive-showcase.tsx` | `routes/architecture/dsd.tsx`                    | `<reactive-showcase>` |

### 3.2 Islands (infrastructure/dependency)

| Island             | Reason                                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scroll-reveal.ts` | Used as DsdElement base/style utility by multiple other islands. Not imported by routes directly but provides shared CSS templates via `StyleSheet`. |

### 3.3 Data files

| File                           | Used By                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| `data/_generated-blog-data.ts` | Blog routes via `@openelement/content/blog-data` virtual module |
| `data/_generated-nav.ts`       | All routes via `@openelement/content/nav` virtual module        |
| `data/_generated-i18n-data.ts` | Build pipeline via `@openelement/i18n/data` virtual module      |
| `data/registry/hub-data.ts`    | Registry routes                                            |
| `data/registry/hub-index.ts`   | Registry routes                                            |

### 3.4 Components

| Component                   | Used By                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| `components/page-styles.ts` | 14+ routes (all guide, architecture, blog, changelog, contributing pages) |

### 3.5 Import verification result

All islands use correct import paths:

- `@openelement/core` for `DsdElement`, `defineIsland`
- `@openelement/style-sheet` for `StyleSheet`
- `@openelement/signals` for `signal`
- `@openelement/adapter-vanilla` for `WithDsdHydration` (media-chrome)
- `@openelement/adapter-react` for `WithDsdHydration` (react)

No instances of incorrect `@openelement/runtime` imports found in functional code.

---

## 4. Content Orphans

**Result: ZERO orphans found.**

All content files are referenced:

- Blog MD files → referenced by `_generated-blog-data.ts` (auto-generated from content directory)
- Architecture MD files → referenced by their respective routes
- Guide MD files → referenced by their respective routes

---

## 5. Duplicate Functionality

### 5.1 counter-island: Two implementations

| Location                               | Type             | Features                                                   |
| -------------------------------------- | ---------------- | ---------------------------------------------------------- |
| `www/app/islands/counter-island.tsx`   | Island component | Reactive DSD with signals, Open Props styling, interactive |
| `routes/guide/getting-started.tsx:147` | Inline class     | Simple counter demo for documentation                      |

The island implementation uses `signal()` and is a proper interactive component.\
The inline class in getting-started is a minimal documentation example.

**Recommendation**: Since neither actually renders a functional counter on a live page (the getting-started route only shows code, not demos), the island file can be deleted unless there's a plan to add an interactive demo to the getting-started page.

---

## 6. Bundle Bloat Analysis

### Client bundle: 558 KB total (exceeds 200 KB budget)

| Bundle                              | Size       | Status                            |
| ----------------------------------- | ---------- | --------------------------------- |
| `client-*.js`                       | 171 KB     | Shared runtime — legitimate       |
| `island-media-chrome-showcase-*.js` | **175 KB** | **DEAD** — delete this island     |
| `flexsearch.bundle.module.min-*.js` | 49 KB      | Legitimate — used by less-search  |
| `island-shoelace-showcase-*.js`     | 80 KB      | From packages/ui — borderline     |
| `island-less-term-*.js`             | 32 KB      | From packages/ui — borderline     |
| `island-api-consumer-*.js`          | 23 KB      | From packages/ui — borderline     |
| `island-react-showcase-*.js`        | **12 KB**  | **DEAD** — delete this island     |
| `island-less-search-*.js`           | 8.0 KB     | Legitimate — search functionality |
| `island-less-toc-*.js`              | 3.1 KB     | Legitimate — table of contents    |
| `island-counter-island-*.js`        | **1.9 KB** | **DEAD** — unused duplicate       |
| Others                              | ~3 KB      | Various runtime helpers           |

### Estimated savings from deletions:

- Delete `media-chrome-showcase`: **-175 KB**
- Delete `react-showcase`: **-12 KB**
- Delete demo islands (4 files): **~3 KB** (shared chunks shrink)
- Delete `counter-island`: **-1.9 KB**
- **Total savings: ~192 KB** (34% of total JS budget)

Remaining client JS after cleanup: ~366 KB (still above 200 KB budget, but much closer)

### Remaining budget concerns:

- `flexsearch.bundle.module.min`: 49 KB for a search library. Consider lighter alternatives (e.g., MiniSearch, Fuse.js ~4 KB, or Pagefind)
- `island-shoelace-showcase`: 80 KB from packages/ui. If this isn't displayed on any active page, consider removing from packages/ui/src.

---

## 7. Build Output Verification

Build command: `deno task build` (in www/)

### Build process:

1. **Phase 1**: SSR bundle — 537 KB server entry (all islands bundled on server side)
2. **Phase 2**: Client island build — 8 islands, 558 KB total JS
3. **Phase 3**: SSG — 60 HTML pages, 3.3 MB total

### Dead files in client bundle:

All demo islands AND showcase islands are bundled into client JS despite having zero route references. The build system's auto-discovery scans `www/app/islands/` and includes all files found there.

### Budget warnings from build:

- `client-*.js` (171 KB) exceeds 50 KB budget
- `island-media-chrome-showcase-*.js` (175 KB) exceeds 50 KB budget
- `island-shoelace-showcase-*.js` (80 KB) exceeds 50 KB budget
- Total JS (558 KB) exceeds 200 KB budget

---

## 8. Unused Directories

- `www/app/pages/` — Directory does not exist. No cleanup needed.
- `www/app/shared/` — Directory does not exist. No cleanup needed.

---

## Recommended Action Plan

### Phase 1: Immediate DELETE (safe, zero impact)

1. Delete `www/app/islands/demo-idle.ts`
2. Delete `www/app/islands/demo-load.ts`
3. Delete `www/app/islands/demo-only.ts`
4. Delete `www/app/islands/demo-visible.ts`
5. Delete `www/app/islands/media-chrome-showcase.ts`
6. Delete `www/app/islands/react-showcase.ts`
7. Delete `www/app/islands/counter-island.tsx`

### Phase 2: Documentation FIX

8. Update `routes/architecture/islands.tsx:122` code example — replace `@openelement/runtime` with correct imports

### Phase 3: Build optimization (for later)

9. Evaluate `flexsearch` vs lighter alternatives for less-search
10. Review packages/ui/ islands (`shoelace-showcase`, `less-term`, `api-consumer`) — if unused, remove from source

### Verification steps after cleanup:

```bash
deno task build  # Verify build still succeeds
deno task test   # Run tests
```

### Expected result:

- Client bundle: 558 KB → ~366 KB (-34%)
- Island count: 8 → 5 (removing 3 dead + 4 demo islands)
- Budget warnings: 4 → 2 (flexsearch + client.js still over budget)
