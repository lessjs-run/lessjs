# ADR-0035: SSG Resilient Rendering + Visual Overhaul (Phase 6)

- Status: Accepted
- Date: 2026-05-19

## Context

v0.19.0 Phase 1-5 delivered a working Registry Hub with component browser, but has two
significant problems:

### Problem A: SSG Rendering Crashes on Client-Only Components

The DSD report shows 72 errors across 51 pages, all from Shoelace components:

| Component    | Errors | Recoverable | Root Cause                                    |
| ------------ | ------ | ----------- | --------------------------------------------- |
| sl-menu-item | 27     | yes         | `this.host.querySelector` in SSR              |
| sl-tab       | 9      | yes         | `this.host.querySelector` in SSR              |
| sl-input     | 6      | NO          | Constructor failure (`Failed to instantiate`) |
| sl-checkbox  | 3      | yes         | DOM access during SSR                         |
| ... (9 more) | 27     | mostly yes  | Same pattern: DOM API in non-browser          |

**Root cause**: `renderNestedCustomElements()` (in `packages/core/src/render-nested.ts`)
already has `isClientOnlyTag()` + `__LESS_CLIENT_ONLY_TAGS__` infrastructure (added in
v0.17.4), but the SSG build pipeline doesn't correctly classify Shoelace components as
client-only. The `entry-descriptor.ts` admission plan classifies them correctly, but the
runtime `__LESS_CLIENT_ONLY_TAGS__` set isn't populated for Shoelace because Shoelace
components are loaded as external npm dependencies, not as LessJS islands.

Additionally, `renderDsd()` (in `packages/core/src/render-dsd.ts`) instantiates the
component class and calls `render()`. If instantiation or render throws (e.g., Shoelace
calls `querySelector`), the error is caught and recorded, but the component's shadow DOM
is left empty — producing broken output rather than a graceful fallback.

**Key insight**: The infrastructure to skip client-only components **already exists** in
`render-nested.ts`. The bug is that Shoelace tags aren't in the `__LESS_CLIENT_ONLY_TAGS__`
set at SSG runtime. And even for tags that ARE in the set, if `renderDsd()` is called
directly (not via `renderNestedCustomElements`), there's no try/catch guard.

### Problem B: Visual Quality

The entire LessJS www site feels visually flat and unpolished:

1. **Hub snapshot previews are broken**: Shoelace component snapshots contain hundreds of
   lines of CSS variable dumps from adoptedStyleSheets, polluting the host page. The
   `:host` → `tagName` replacement produces non-functional CSS selectors.
2. **No visual hierarchy**: Flat monochrome, no depth via shadows/gradients, tiny type
   scale, no breathing room between sections.
3. **No personality**: The site looks like a generic documentation template, not a
   framework that positions itself as "Less is More —精密·克制·有深度".
4. **Component previews**: Currently embedded as raw HTML via `unsafeHTML()` — Shoelace
   components render as unstyled raw HTML because their shadow DOM CSS doesn't work
   outside the component's shadow root.

## Decision

### A: SSG Resilient Rendering (3 changes)

**A1. Enforce `__LESS_CLIENT_ONLY_TAGS__` for all non-SSR-capable components**

In the SSG build pipeline (`packages/adapter-vite/src/entry-renderer.ts`), the
`__LESS_CLIENT_ONLY_TAGS__` global is already injected. The fix is to ensure Shoelace
tags are included in `ssrAdmissionPlan.clientOnlyTags` during the admission plan phase.

Currently, `buildSsrAdmissionPlan()` in `entry-descriptor.ts` only adds tags that appear
in the route's island scan. Shoelace components used in `hub-data-full.ts` snapshots are
not islands — they're static data. The fix: the admission plan must also include tags from
the Hub scanner's `WC_PACKAGES` list that have `compatibility: 'client-only'`.

**A2. Add try/catch fallback in `renderDsd()`**

When `renderDsd()` catches an instantiation or render error, instead of recording the
error and producing broken output, it should fall back to **bare-tag output** — output
just the custom element tag with its attributes and light DOM content, without any
shadow DOM:

```
// Before (error case): <sl-button><template shadowrootmode="open"></template>Click</sl-button>
// After (fallback):    <sl-button variant="primary">Click</sl-button>
```

The browser will upgrade `<sl-button>` when the JS loads. This is correct progressive
enhancement — the component will work after hydration even if SSG couldn't render its
shadow DOM.

**A3. Hub snapshot preview: iframe srcdoc isolation**

Replace `unsafeHTML(sanitizeSnapshot(tag.ssrSnapshot))` with `<iframe srcdoc="...">`:

- Shoelace components: `srcdoc` includes the Shoelace import + theme CSS + component tag
  → renders perfectly in isolation
- LessJS UI components: `srcdoc` includes the component import + demo content
  → renders with real shadow DOM
- Client-only components that can't be imported: Show a styled placeholder card

Snapshot data structure shifts from "serialized HTML dump" to "structured metadata":

```ts
interface HubSnapshotMeta {
  tagName: string;
  importSpec: string; // e.g. '@shoelace-style/shoelace'
  importUrl: string; // e.g. 'https://esm.sh/@shoelace-style/shoelace@2.20.1'
  demoAttrs: Record<string, string>;
  demoSlots: string;
  themeCssUrl?: string; // e.g. Shoelace light.css CDN
  compatibility: 'ssr-capable' | 'client-only';
}
```

This also dramatically reduces `_hub-data-full.ts` size (from hundreds of KB of
serialized shadow DOM to a few KB of structured metadata per component).

### B: Visual Overhaul (4 layers)

**B1. Foundation — CSS variables + typography**

Current: OpenProps gray scale, no brand color usage, small type, tight spacing.

Changes:

- Brand color activation: `--less-brand: #534AB7` → use as accent in headings, links, badges
- Type scale upgrade: `h1` from 2rem → 2.5rem, `h2` from 1rem → 1.25rem
- Spacing: introduce `--less-size-8` (2rem) and `--less-size-12` (3rem) gaps between sections
- Code blocks: dark theme (One Dark), language label, better line-height
- Shadows: 3-tier shadow system (sm/md/lg) added to `tokens/effects.ts`
- Border radius: unify to `6px` cards, `8px` containers

**B2. Component upgrades — `@openelement/ui`**

- `less-layout`: Frosted glass nav (`backdrop-filter: blur(12px)`), active sidebar highlight
- `less-code-block`: Dark code theme, language badge, copy animation
- `less-button`: Gradient accent variant, hover scale micro-animation
- `less-card`: Elevated shadow, hover lift transition
- `less-theme-toggle`: Smooth icon transition

**B3. Page-level redesign**

- **Homepage**: Hero section with large brand statement, animated gradient, code example
- **Registry**: Grid card layout (3-col), filter pills, empty state illustration
- **Blog**: Cover placeholder, reading time, date formatting
- **Engine docs**: Code example layout with copy buttons
- **Guide**: Sticky TOC sidebar, progress indicator

**B4. Polish**

- "Less is More" text gradient animation on homepage
- Iframe preview loading skeleton
- View Transitions morphing (already using the API, add `view-transition-name`)
- Dark/light theme switch transition

## Consequences

### Positive

- 72 DSD render errors → 0 (client-only components gracefully skipped)
- Hub component previews render correctly in iframe isolation
- `_hub-data-full.ts` shrinks from ~300KB to ~20KB
- Entire site gets a visual upgrade that matches the "精密·克制·有深度" brand
- Existing `isClientOnlyTag()` infrastructure is leveraged, not reinvented

### Negative

- Iframe previews have a fixed height — need resize observer or explicit sizing
- Shoelace previews depend on esm.sh CDN (already the case; will be resolved by
  ADR-0034 hermetic migration later)
- Visual overhaul is subjective — needs iteration
- Some Shoelace components may flash unstyled before iframe loads

### Risks

- A1 requires understanding the SSG admission plan flow — wrong classification could
  skip SSR-capable components. Mitigated by: only affect tags from Hub's `client-only`
  packages, not all custom elements on the page.
- B1-B4 are cosmetic — no functional risk, but increases CSS surface area. Mitigated
  by: keeping changes in design tokens + page-styles, not inline styles.

## Implementation Order

```
A1 (SSG client-only enforcement) → A2 (renderDsd fallback) → A3 (iframe previews)
                                                                    ↓
B1 (foundation CSS) → B2 (components) → B3 (pages) → B4 (polish)
```

A1+A2 first because they fix bugs. B1 next because it's high-impact, low-risk.
A3 can ship alongside B2 because both touch the component detail page.

See `docs/sop/v0.19.0-phase6-ssg-visual-overhaul.md` for step-by-step instructions.

## Related

- ADR-0032 (Playwright snapshot rendering)
- ADR-0033 (Three-pillar architecture positioning)
- ADR-0034 (Hermetic hub snapshots — future CDN elimination)
- `packages/core/src/render-nested.ts` (isClientOnlyTag infrastructure)
- `packages/adapter-vite/src/entry-descriptor.ts` (SSR admission plan)
