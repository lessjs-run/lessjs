# ADR-0064: Static Content Injection Model

**Status**: Proposed\
**Date**: 2026-05-30\
**Target**: v0.27.0\
**Depends on**: ADR-0062 (DSD-First RDOM Signal Architecture)

## Context

LessJS uses a JSX + Signal rendering model where `render()` produces VNodes and signal → effect → `setAttribute` drives atomic DOM updates. This works well for dynamic UI elements where reactivity is required.

However, blog and guide content follows a fundamentally different pattern: markdown rendered to sanitized HTML at **build time**, injected as-is into the page, and never mutated after initial render. Currently, blog pages use `innerHTML={html}` as a JSX prop — which bypasses the signal model entirely — but this behavior is implicit and undocumented.

The tension: signal binding for immutable content is wasteful (allocate signal, create effect, observe for changes that never happen). We need an explicit, documented mechanism that distinguishes static content injection from reactive signal binding.

## Decision

### Two Approved Injection Paths

1. **Signal-driven** (dynamic UI): `data-theme={signal}` → effect → `setAttribute` — for reactive bindings that may change over time.
2. **Static HTML injection** (build-time content): `innerHTML={html}` where `html` comes from the `@lessjs/content` pipeline (marked + sanitize-html). No signal needed.

### SSR Path: `renderToString` treats `innerHTML` as raw children

When `innerHTML` is present on a VNode and holds a truthy value:

```ts
// render-to-string.ts — SSR rendering
function renderVNode(vnode: VNode): string {
  const { tag, props, children } = vnode;
  const attrs = renderAttributes(props);

  // innerHTML has priority over children
  if (props?.innerHTML != null) {
    return `<${tag}${attrs}>${sanitizeHtml(props.innerHTML)}</${tag}>`;
  }

  const inner = children?.map(renderVNode).join('') ?? '';
  return `<${tag}${attrs}>${inner}</${tag}>`;
}
```

The SSR path inline-expands the HTML string as raw children. This matches how the browser treats `innerHTML` setter — the HTML string becomes child nodes.

### CSR Path: `applyProps` sets `el.innerHTML = value`

When a VNode patch is applied to a live DOM element:

```ts
// render.ts — CSR prop patching
function applyProps(
  el: HTMLElement,
  props: Record<string, any>,
  oldProps?: Record<string, any>,
): void {
  for (const [key, value] of Object.entries(props)) {
    // innerHTML: raw assignment, not signal-bound
    if (key === 'innerHTML') {
      if (value !== oldProps?.innerHTML) {
        el.innerHTML = value;
      }
      continue;
    }

    // Signal-driven attributes
    if (isSignal(value)) {
      createEffect(() => el.setAttribute(key, String(value())));
      continue;
    }

    // Static attributes
    el.setAttribute(key, value);
  }
}
```

The key distinction: `innerHTML` is compared by value (string equality), not subscribed to a signal. If it never changes, the `setAttribute` path (for `class`, `id`, `data-*`) still applies to other props on the same element.

### Build-Time Content Pipeline

```ts
// packages/content/src/render.ts
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export async function renderMd(mdPath: string): Promise<string> {
  const raw = await readFile(mdPath, 'utf-8');
  const html = await marked.parse(raw);
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'code', 'pre']),
    allowedAttributes: sanitizeHtml.defaults.allowedAttributes,
  });
}
```

Blog/guide pages consume this at build time:

```tsx
// www/app/routes/guide/[page].tsx
import { renderMd } from '@lessjs/content';

export default async function GuidePage({ params }: { params: { page: string } }) {
  const html = await renderMd(`www/content/guide/en/${params.page}.md`);
  return <article class='prose' innerHTML={html} />;
}
```

### Allowed Props for Static Injection

| Prop        | Usage                                      | Signal Binding |
| ----------- | ------------------------------------------ | -------------- |
| `innerHTML` | Static, sanitized, build-time HTML content | No             |
| `class`     | CSS class list                             | Optional       |
| `id`        | Element identifier                         | Optional       |
| `data-*`    | Data attributes (theme, locale, etc.)      | Yes            |

## Rationale

- **MD content is immutable after build** — creating a signal that wraps `html` and an effect that calls `setAttribute` every time the DOM re-evaluates is wasteful. The string never changes.
- **`innerHTML` is the idiomatic mechanism** — React has `dangerouslySetInnerHTML`, Vue has `v-html`, Solid has `innerHTML`. Every major framework provides a prop-based escape hatch for static HTML.
- **Minimal API surface** — a single JSX prop, no new runtime concepts, no new imports for consumer code.
- **Explicit intent** — `innerHTML={html}` in JSX signals "this content is HTML, inject it as-is" to both human readers and the render pipeline.

## Constraints

- **Only allowed for content from `@lessjs/content`** (marked + sanitize-html). Content is sanitized at build time; no runtime XSS risk.
- **Not for user-generated content** — any `innerHTML` assignment involving runtime user input must go through explicit sanitization and a separate review.
- **Not for content that changes** — if content needs to update based on signal state, use signal-driven DOM children (e.g., `<div>{signalContent}</div>`), not `innerHTML`.
- **SSR and CSR must handle it consistently** — the `innerHTML` prop must produce identical HTML output in both paths (SSR: inline in HTML string; CSR: `el.innerHTML = value`).

## Consequences

### Positive

- **No wasted signal allocations** — blog/guide pages skip signal creation for immutable content
- **Explicit intent** — `innerHTML` in JSX is a clear visual marker for injected HTML
- **Aligns with ecosystem standards** — React, Vue, Solid all provide equivalent mechanisms
- **Zero new dependencies** — relies on existing marked + sanitize-html in `@lessjs/content`

### Negative

- **XSS footgun potential** — `innerHTML` is inherently dangerous. The pipeline constraint (only from `@lessjs/content`) is a convention, not a compiler-enforced guarantee. Future developers could misuse it.
- **Rich children not supported** — `innerHTML` replaces all children; you cannot combine static injected HTML with signal-driven children on the same element.
- **SSR/CSR duplication risk** — if the two paths diverge in behavior, content rendered server-side may differ from client-side hydration.

### Neutral

- `innerHTML` assignment does not interact with the signal system — no effect tracking, no dependency graph entry, no re-render triggers
- The `sanitize-html` config in `@lessjs/content` is the single source of truth for allowed tags/attributes
- Content authors write standard markdown; the `innerHTML` prop is invisible to them

## Implementation Notes

### VNode Type Extension

```ts
// packages/rdom/src/vnode.ts
export interface VNodeProps {
  innerHTML?: string; // static HTML injection
  [key: string]: any; // other attributes (class, id, data-*, etc.)
}
```

### SSR Render Path

```ts
// packages/rdom/src/render-to-string.ts
if (vnode.props?.innerHTML != null) {
  return `<${vnode.tag}${
    renderAttrs(omit(vnode.props, ['innerHTML']))
  }>${vnode.props.innerHTML}</${vnode.tag}>`;
}
```

### CSR Apply Props Path

```ts
// packages/rdom/src/apply-props.ts
if (key === 'innerHTML') {
  if (value !== oldValue) el.innerHTML = value;
  continue; // skip setAttribute
}
```

### Comparison: Signal-Driven vs Static Injection

|                   | Signal-Driven                      | Static Injection         |
| ----------------- | ---------------------------------- | ------------------------ |
| **Use case**      | Reactive UI (theme, locale, state) | MD content, blog posts   |
| **Value source**  | Signal (mutable)                   | Build-time HTML string   |
| **DOM mechanism** | setAttribute via effect            | innerHTML direct set     |
| **Re-renders**    | On signal change                   | Never                    |
| **Overhead**      | Signal + effect + observation      | Single string assign     |
| **JSX syntax**    | `<div data-theme={signal}>`        | `<div innerHTML={html}>` |
