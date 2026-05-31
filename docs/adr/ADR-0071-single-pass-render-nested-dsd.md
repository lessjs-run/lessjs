# ADR-0071: Single-Pass Render — Unify `renderToString` + `renderNestedCustomElements` into `renderNestedDsd`

| Metadata       | Value                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| **ADR**        | 0071                                                                                          |
| **Status**     | ACCEPTED                                                                                      |
| **Date**       | 2026-05-31                                                                                    |
| **Author**     | Qi (Delivery Director), with Zhi (Architect)                                                  |
| **Deciders**   | Zhi                                                                                           |
| **Supersedes** | ADR-0065 §"renderNestedCustomElements" pattern（部分替代）                                    |
| **Version**    | v0.28.0                                                                                       |
| **Related**    | ADR-0062 (DSD architecture), ADR-0065 (unified VNode pipeline), ADR-0070 (app shell boundary) |

---

## Context

### Background — Two Tree Traversals, One Tree

ADR-0065 established the **unified VNode pipeline**: `render()` returns a VNode tree, and both SSR (`renderToString`) and CSR (`renderToDom`) consume that same tree. This decision was correct — it eliminated the dual representation problem.

However, ADR-0065 left one architectural defect untouched: **nested custom element rendering**. When a component's VNode tree contains other custom elements (e.g., `less-layout` contains `<less-search>` and `<less-theme-toggle>`), those nested elements must themselves be rendered through `renderDsd()`. ADR-0065 handled this by adding a **second tree traversal** — `renderNestedCustomElements()` — that operates on the **already-serialized HTML string**, re-parsing it with `parse5` to build a new AST.

The result is an architecture where **the same logical tree is traversed twice**:

1. `renderToString(VNode)` — serializes VNode → HTML string. Custom elements become empty tags (`<less-search></less-search>`).
2. `renderNestedCustomElements(HTML)` — `parse5.parse()` rebuilds a tree, then traverses it again to find custom elements and call `renderDsd()` on each.

Between these two traversals, `__wrapAppShell()` in `entry-renderer.ts` further complicates the picture by wrapping page content in `<less-layout>` as a **string concatenation**, bypassing `renderDsd` entirely for the layout component.

### Problem Manifestation — Three Production Bugs

During v0.28.0 deployment to `https://dev.lessjs.pages.dev/`, three bugs were reported:

| Bug       | Symptom                                   | Root Cause                                                                                                     |
| --------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Bug 1** | Sidebar disappears on `/zh/guide/*` pages | `less-layout`'s DSD template is absent — `__wrapAppShell` string-concatenated it without calling `renderDsd()` |
| **Bug 2** | Search panel shows `[object Object]`      | `<dialog>` in `less-search.tsx` + signal computed values being `String()`-converted during SSR                 |
| **Bug 3** | Search panel doesn't follow theme         | `dialog::backdrop` doesn't inherit shadow DOM CSS custom properties                                            |

All three bugs trace to the same architectural weakness: **the pipeline has two tree traversals separated by a string concatenation step, and the intermediate string form loses structural guarantees that the VNode tree provides.**

### Why This Happened — Historical Accretion

The two-traversal design was not malicious. It grew organically:

1. **v0.15**: `renderToString` was written first — a simple VNode→HTML serializer. Nested custom elements were not a concern because pages rendered flat content.
2. **v0.18–v0.19**: Registry Hub was added, introducing nested custom elements in SSR output. Rather than refactoring `renderToString` to handle CE recursion, `renderNestedCustomElements` was built as a **post-processing pass** on the serialized HTML.
3. **v0.27**: `entry-renderer.ts` `__wrapAppShell` was added as a string template shortcut to wrap page content in `less-layout`. It never called `renderDsd`.

Each step was individually reasonable. Together, they created a fragile pipeline where **structural information is discarded mid-pipeline and then rebuilt from a lossy intermediate format**.

### Current Architecture (What's Wrong)

```
render() → VNode tree (AST)
    │
    ▼ TRAVERSAL 1 — renderToString
HTML string  ←  tree flattened, custom elements are empty tags
    │
    ▼ __wrapAppShell (string concatenation)
"<less-layout>${html}</less-layout>"  ←  less-layout is a string, not a VNode
    │
    ▼ parse5.parse → new AST
parse5 Document  ←  tree rebuilt from scratch
    │
    ▼ TRAVERSAL 2 — renderNestedCustomElements
final HTML  ←  custom elements now have DSD templates
```

### Industry Reference — How Others Handle This

| Framework            | Component Nesting in SSR                                        | Tree Traversal Count |
| -------------------- | --------------------------------------------------------------- | -------------------- |
| **React**            | `renderToString()` recursively calls child component `render()` | 1 pass               |
| **Vue 3**            | `renderComponentVNode()` recursively `renderComponentRoot()`    | 1 pass               |
| **Lit SSR**          | `render()` → recursive `renderTemplateResult()` for child CE    | 1 pass               |
| **SolidJS**          | `renderToString()` recursively `renderComponent()`              | 1 pass               |
| **Astro**            | Compiler resolves component tree at build time                  | 0 runtime passes     |
| **SvelteKit**        | Compiler generates recursive `$$render` calls                   | 0 runtime passes     |
| **LessJS (current)** | `renderToString` + parse5 + `renderNestedCustomElements`        | **2 passes**         |

**Every framework does this in one pass.** LessJS is the only one that serializes, re-parses, and then re-traverses.

---

## Decision

### Principle

**VNode is the one AST. There shall be exactly one tree traversal from VNode to final HTML. Nested custom element rendering happens inline during that traversal.**

### Target Architecture (What's Right)

```
render() → VNode tree (AST)
    │
    ▼ SINGLE TRAVERSAL — renderNestedDsd
    │
    │  for each child in VNode.children:
    │    ├─ string tag + CE registered → renderDsd(tag, props) → inline DSD
    │    ├─ string tag + not CE          → serialize, recurse children
    │    ├─ Fragment                     → expand children, recurse
    │    ├─ Function (class component)   → new instance, render(), recurse
    │    └─ string (text node)           → emit as-is
    │
    ▼
final HTML (all CEs with DSD templates, single pass)
```

### Key Decisions

1. **Delete `renderNestedCustomElements`** — the entire function and its file (`render-nested.ts`). Its logic is subsumed into the unified traversal.

2. **Delete `parse5` dependency** — no longer needed. The VNode tree is the AST; there is no HTML string to re-parse mid-pipeline.

3. **Delete `__wrapAppShell`** — the string concatenation function in `entry-renderer.ts`. `less-layout` becomes a normal custom element rendered by the unified traversal like any other.

4. **Delete `visited` Set cycle detection** — Trees are acyclic by definition. The `visited.has("less-code-block@1")` pattern was a workaround for parse5 rebuilding a flat structure without ancestry context. In a unified VNode traversal, the parent-child relationship is explicit and cycles are structurally impossible.

5. **`renderNestedDsd` replaces `renderToString`** — same VNode input, same HTML string output, same serialization logic. The only difference: when it encounters a registered custom element tag, it calls `renderDsd()` inline and embeds the result, rather than outputting an empty tag.

6. **Full pipeline is async** — `renderDsd()` is async, so the unified traversal must be async. This is acceptable: `renderNestedCustomElements` was already async, and all callers already use `await`.

### What Gets Removed

| Artifact                                                              | Reason                                       |
| --------------------------------------------------------------------- | -------------------------------------------- |
| `packages/core/src/render-nested.ts` (~430 lines)                     | Entire logic absorbed into unified traversal |
| `renderNestedCustomElements` export from `packages/core/src/index.ts` | No external caller after ADR-0070 cleanup    |
| `parse5` dependency in `packages/core/deno.json`                      | No longer used                               |
| `visited` Set + cycle detection in `render-dsd.ts` (~15 lines)        | Trees are acyclic                            |
| `__wrapAppShell()` in `entry-renderer.ts` (~10 lines)                 | `less-layout` rendered normally              |
| `lines.push(...)` code generation for `__wrapAppShell` (~20 lines)    | No generated code needed                     |
| `import { renderNestedCustomElements }` in SSR entry code             | No longer needed                             |

### What Gets Added

| Artifact                                                          | Lines (est.) | Purpose                                        |
| ----------------------------------------------------------------- | ------------ | ---------------------------------------------- |
| `isRegisteredCustomElement(tag)` helper in `jsx-render-string.ts` | ~5           | Quick `customElements.get()` check             |
| Inline CE rendering branch in the unified traversal               | ~15          | Call `renderDsd()` when tag is a registered CE |
| Async signature on traversal function                             | 1 line       | `async function renderNestedDsd(vnode)`        |

**Net change: approximately -45 lines.**

### Benefits

| Dimension                   | Before                                             | After                                      |
| --------------------------- | -------------------------------------------------- | ------------------------------------------ |
| Tree traversals             | 2 (renderToString + parse5 rebuild + renderNested) | **1**                                      |
| Structural information      | Lost mid-pipeline (VNode→string)                   | **Preserved throughout**                   |
| `less-layout` DSD rendering | Bypassed (`__wrapAppShell` string)                 | **Normal path**, like any CE               |
| Custom element Tags         | Empty in intermediate HTML                         | **Fully rendered in single pass**          |
| Cycle detection             | `visited.has("x@1")` false positives               | **Structurally impossible**                |
| parse5 dependency           | Required                                           | **Removed**                                |
| Bug 1 (sidebar)             | Caused by bypassed DSD                             | **Cannot occur** (all CEs same path)       |
| Bug 2 (`[object Object]`)   | Caused by dialog + string serialization            | **Eliminated** (removed in separate fix)   |
| Bug 3 (theme)               | Caused by `::backdrop` isolation                   | **Eliminated** (removed in separate fix)   |
| TypeScript coverage         | String-generated code not checked                  | **Full coverage** (no generated code)      |
| Audit surface               | 3 functions, 2 files, parse5                       | **1 function, 1 file, 0 external parsers** |

---

## Consequences

### Positive

- **Architectural simplicity**: One traversal, one AST, one serialization step. The model matches the code; the code matches the model.
- **Bug elimination**: Three production bugs become structurally impossible because their root cause (the string intermediate between two traversals) ceases to exist.
- **Performance**: Eliminates parse5 parsing of ~60-80KB HTML per page. For a 351-page SSG build, that's ~20-28MB of unnecessary parsing removed.
- **Dependency reduction**: parse5 removed from dependency tree.
- **Type safety**: No more generated string code. Deno tsc covers the entire pipeline.
- **Future-proofing**: Any future custom element added to any component's VNode tree will automatically get `renderDsd()` treatment. No need to remember to add it to any registry or visited Set.

### Negative

- **Async propagation**: `renderNestedDsd` is async where `renderToString` was sync. All internal callers already use `await`; no external API breakage.
- **Migration risk**: The change touches the core rendering pipeline. Mitigated by full test suite (953 tests) and SSG build verification (351 pages).

### Neutral

- `renderNestedDsd` has more branches than `renderToString` (CE rendering path). This is a simple `if (customElements.get(tag))` check — complexity increase is marginal.
- The `less-layout` component must be SSR-safe (no `location.*` access during `render()`). This was already fixed in ADR-0070's `_currentPath()` attribute-fallback logic.

### Rejected Alternatives

1. **Keep parse5, fix visited Set** (rejected): Would fix the cycle false positive but not the two-traversal structural problem. Bugs 1-3 would persist because `__wrapAppShell` would still bypass `renderDsd`.

2. **Move `renderNestedCustomElements` to operate on VNode tree instead of HTML string** (rejected): Would still be two functions doing similar but separate traversals. Cleaner to merge into one.

3. **Generate `_app-shell.ts` on disk instead of string concatenation** (rejected per ADR-0070): `less-layout` doesn't need special treatment — it's a normal custom element that should be rendered through the same pipeline as every other CE.

---

## Implementation

See **SOP-011: Unified Render Nested DSD** (`docs/sop/v0.27.0/SOP-011-unified-render-nested-dsd.md`) for the step-by-step implementation guide with verification checklist.
