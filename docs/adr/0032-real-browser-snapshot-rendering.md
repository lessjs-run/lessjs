# ADR-0032: Real Browser Snapshot Rendering (Replace happy-dom)

- Status: Proposed
- Date: 2026-05-17
- Target: v0.19.0 (Phase 3)
- Supersedes: ADR-0029 (Happy DOM for DOM Simulation)

## Context

The Hub component detail pages need rendered previews of Web Components.
The current implementation uses **happy-dom** to simulate a browser environment
at build time (`hub:scan`), then serializes the shadow DOM to static HTML.

This approach has accumulated significant technical debt:

### Problems with happy-dom Snapshot Rendering

1. **Type incompatibility** — happy-dom's `Window`, `HTMLElement`, `Node` types
   don't overlap with browser-native types. Every interaction requires `as unknown as`
   intermediate casts (5+ locations in `snapshot-renderer.ts`).

2. **Slot extraction fragility** — `el.children` only returns Element nodes; Text
   nodes (e.g., `innerHTML = "plain text"`) are silently dropped. Fixed once,
   but similar edge cases are inevitable with any DOM simulation.

3. **Constructable stylesheets not serialized** — Lit uses `adoptedStyleSheets`
   which don't appear in `innerHTML`. We had to add explicit conversion logic
   (`adoptedStyleSheets` → `<style>` tags), and this pattern repeats for every
   browser API that behaves differently in simulation vs reality.

4. **Global state pollution** — happy-dom requires replacing ALL global
   constructors (HTMLElement, customElements, ShadowRoot, Node, Element, Event,
   CSSStyleSheet, ResizeObserver, localStorage, getComputedStyle, navigator,
   matchMedia, DOMParser, MutationObserver, DocumentFragment...). Missing one
   causes silent failures.

5. **Subprocess isolation required** — Lit's module caching with
   `@lit-labs/ssr-dom-shim` conflicts with happy-dom's globals, forcing each
   component render into a **fresh Deno subprocess**. This adds ~1-2s per
   component (53 components × 1.5s = ~80s for `hub:scan`).

6. **:host selector replacement hack** — `:host` CSS selectors only work inside
   shadow DOM. We replace them with the tag name via regex, which breaks for
   `:host(.class)` and `:host-context()` selectors.

7. **Media Chrome's isShimmed detection** — Components that check
   `globalThis.global === globalThis` (Media Chrome's `server-safe-globals.js`)
   require additional patches to bypass server-mode no-ops.

**The fundamental issue**: happy-dom simulates a browser, but it is NOT a browser.
Every behavioral difference is a potential bug we must discover, diagnose, and patch.

### What We Actually Need

For Hub component previews, we need the **rendered HTML output** of each component —
the same HTML a real browser would produce. We do NOT need:

- Runtime interactivity in the snapshot
- JavaScript execution in the preview page
- Event handling or user interaction

This means: a real browser can render the component, we capture the DOM state
after rendering, and serialize it to static HTML. No simulation needed.

## Decision

**Replace happy-dom snapshot rendering with Playwright-based real browser rendering.**

Use the **existing Playwright + Chromium** setup (already in CI for e2e tests)
to render each component in a real browser, capture the serialized shadow + light DOM,
and save as static HTML snapshots.

### Architecture

```
hub:scan
  │
  ├─ For each package:
  │   │
  │   ├─ Generate fixture HTML page (one page per component)
  │   │   - <script type="module"> imports component
  │   │   - Instantiates component with DEMO_ATTRS + DEMO_SLOTS
  │   │   - Appends to document.body
  │   │
  │   ├─ Start temp HTTP server (Deno.serve)
  │   │
  │   ├─ Playwright: navigate to each fixture page
  │   │   - Wait for component to render (waitForSelector + setTimeout)
  │   │   - Evaluate: capture shadowRoot.innerHTML + light DOM
  │   │   - Evaluate: serialize adoptedStyleSheets to <style> tags
  │   │   - Extract computed slot assignments
  │   │
  │   ├─ Post-process captured HTML:
  │   │   - Sanitize (strip <script>, on* handlers, javascript: URLs)
  │   │   - Replace <slot> with fallback content from light DOM
  │   │   - Wrap in snapshot-preview container
  │   │   - Add theme CSS variables
  │   │
  │   └─ Stop temp server
  │
  └─ Write hub-index + hub-data TypeScript modules
```

### Key Design Decisions

1. **One fixture page per component** (not per package) — simpler error isolation,
   no cross-component interference, parallel rendering possible.

2. **Inline fixture HTML** — no file I/O for fixtures; generate HTML strings and
   serve from memory via a lightweight HTTP server.

3. **Single Playwright browser instance** — launch once, create a new page per
   component. This is dramatically faster than launching a browser per component
   (happy-dom's subprocess model was ~1.5s/component; Playwright page navigation
   is ~50-100ms/page).

4. **Temp HTTP server** — components need real URL resolution for module imports.
   A lightweight `Deno.serve` on a random port provides this without file I/O.

5. **Shadow DOM serialization via `page.evaluate()`** — run JavaScript in the
   real browser context to extract `shadowRoot.innerHTML`, `adoptedStyleSheets`,
   and slot assignments. This is the ONLY reliable way to get accurate output.

6. **SSR-capable @openelement/ui components** — can continue using
   `renderSnapshotLit()` (ADR-0029's `@lit-labs/ssr-dom-shim` approach) since
   it works perfectly for first-party Lit components. The Playwright path is
   used for **client-only npm packages** (Shoelace, Media Chrome) where happy-dom
   was previously needed.

### What Gets Deleted

| File                                                        | Lines | Reason                                  |
| ----------------------------------------------------------- | ----- | --------------------------------------- |
| `packages/hub/src/cli/render-happy.ts`                      | 299   | Entire subprocess renderer replaced     |
| `packages/hub/src/snapshot-renderer.ts` (happy-dom section) | ~300  | `renderSnapshotWithHappyDom()` removed  |
| `render-happy` subprocess invocation in `scanner.ts`        | ~30   | No more `Deno.Command(Deno.execPath())` |
| `happy-dom` npm dependency                                  | —     | No longer needed for snapshots          |

### What Gets Added

| File                                                 | Purpose                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/hub/src/snapshot-playwright.ts`            | Playwright-based renderer: server, fixture pages, capture, post-process |
| `packages/hub/__tests__/snapshot-playwright.test.ts` | Integration test: render sl-button, verify HTML output                  |

### Performance Comparison

| Metric                  | happy-dom (current)            | Playwright (proposed)                |
| ----------------------- | ------------------------------ | ------------------------------------ |
| Per-component time      | ~1.5s (subprocess spawn)       | ~0.1s (page navigation)              |
| Total 53 components     | ~80s                           | ~6-8s                                |
| CI requirement          | Deno only                      | Chromium (already installed)         |
| Global state pollution  | Yes (patch 15+ globals)        | No (isolated browser tabs)           |
| Type errors             | 5+ (happy-dom ≠ browser types) | 0 (Playwright types are first-class) |
| Rendering accuracy      | ~90% (happy-dom gaps)          | ~99% (real Chromium)                 |
| New browser API support | Requires manual patching       | Automatic (it IS a browser)          |

## Consequences

### Positive

- **Eliminates all happy-dom class of bugs**: type incompatibilities, slot extraction,
  adoptedStyleSheets, global pollution, :host replacement, Media Chrome isShimmed.
- **10-15x faster**: single browser instance + page navigation vs subprocess spawn.
- **Zero type hacks**: no `as unknown as` casts needed; Playwright API is
  TypeScript-first with full type definitions.
- **Accurate rendering**: real Chromium renders exactly as users will see it.
- **Future-proof**: new browser APIs (View Transitions, CSS Container Queries,
  Popover API) work automatically — no simulation patches needed.
- **Reuses existing CI infrastructure**: Playwright + Chromium already installed
  for e2e tests.
- **Simpler mental model**: "render in browser, capture output" vs
  "simulate browser, patch globals, serialize manually".

### Negative

- **Requires Chromium at build time**: `hub:scan` needs Playwright + Chromium
  installed. This is already true for CI and local dev (e2e tests use it).
  For environments without Chromium, a `--skip-snapshots` flag can be added.
- **Playwright dependency for hub package**: `@openelement/hub` gains a dev-time
  dependency on `playwright`. This does NOT affect runtime or published packages.
- **HTTP server for module resolution**: components import from npm specifiers
  which need URL resolution. A temporary HTTP server (Deno.serve) is required.

### Neutral

- `renderSnapshotLit()` for @openelement/ui components stays unchanged — it works
  perfectly and is faster than Playwright for SSR-capable Lit components.
- The `DEMO_ATTRS` and `DEMO_SLOTS` configuration maps stay the same —
  they describe what the component should look like, not how to render it.
- Snapshot output format (HTML string in `HubTagRecord.ssrSnapshot`) stays
  the same — only the generation mechanism changes.

## Alternatives Considered

### Alternative 1: Keep happy-dom, Fix Each Bug Individually

Every few weeks, a new edge case appears (Text nodes, adoptedStyleSheets, Media
Chrome isShimmed, type errors...). Each fix adds complexity. The pattern is clear:
DOM simulation will always be a leaky abstraction.

**Verdict**: Rejected. We've already spent more time debugging happy-dom than
the original implementation took. The fundamental approach is wrong.

### Alternative 2: Use Puppeteer Instead of Playwright

Puppeteer is the older headless Chrome library. Playwright is its spiritual
successor with better cross-browser support, auto-wait capabilities, and
TypeScript-first API. Since the project already uses Playwright for e2e tests,
there's no reason to add a second browser automation library.

**Verdict**: Rejected. Playwright is already a project dependency.

### Alternative 3: Screenshot Capture Instead of HTML

Take a PNG screenshot of each component and display as an image.

**Verdict**: Rejected for Phase 3. Screenshots lose semantic information (can't
select text, can't inspect structure, can't adapt to theme). HTML snapshots
are more useful and smaller. Screenshots could be added as a Phase 4 enhancement.

## References

- [ADR-0029](./0029-happy-dom-for-dom-simulation.md) — Happy DOM for DOM Simulation (superseded)
- [ADR-0031](./0031-hub-v2-component-browser-workflow.md) — Hub v2 Component Browser
- [SOP v0.19.0](../sop/v0.19.0-platform-hub.md) — Platform Hub (Phase 1 & 2)
- [Playwright](https://playwright.dev/) — Browser automation framework
