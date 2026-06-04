# Architecture

openElement is a static-first Web Components framework. The active contract is simple:

- Components return `VNode | null` from JSX.
- SSR serializes VNodes to Declarative Shadow DOM.
- CSR turns the same VNode model into real DOM.
- Events come from JSX handlers and VNode event markers.
- Dynamic island content returns VNodes, not HTML strings.
- HTML injection is reserved for explicit `trustedHtml` boundaries.

## Renderer Pipeline

```text
route/component JSX
  -> VNode IR
  -> renderDsdTree() for SSR/SSG
  -> renderToDom() for CSR and signal-driven updates
```

There is no active `data-on-*` event path and no `data-signal-html` dynamic UI path. `bindSsrProps()` only restores serialized SSR props from `data-ssr-props`; it does not bind events.

## Metadata Boundaries

Route metadata, island metadata, app shell configuration, and package manifests should cross build stages as structured data. Source regex and string-paired generated TypeScript are treated as architecture debt.

## Gates

The architecture gate checks current source and current docs for stale event contracts, stale UI subpaths, unreviewed type escapes, mojibake, and renderer-contract regressions.
