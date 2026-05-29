# ADR-0040: Streaming DSD

> **Status**: ACCEPTED
> **Date**: 2026-05-23
> **Supersedes**: Extends ADR-0033 (Renderer Kernel)
> **Applies to**: v0.21.0 (Reactive DSD)

## Context

`renderDsd()` in v0.20 is synchronous: it renders all components into a single
HTML string, then returns. For large pages (50+ components), this means:

1. Time-To-First-Byte = render time of the entire page
2. The browser sees nothing until every component is rendered
3. One slow component blocks the entire response

The browser's streaming HTML parser can process `<template shadowrootmode="open">`
incrementally — Decalarative Shadow DOM was designed for streaming from day one.

## Decision

**Add `renderDSDStream()` as an async generator producing a `ReadableStream<string>`.**

The streaming mode sends:

1. Document shell (DOCTYPE, head, opening body) — immediately
2. Each component's DSD template — as rendered
3. Document footer (closing tags) — last

Failed components emit a fallback tag and continue; one slow component doesn't
block the entire page.

## Architecture

```
renderDSDStream('my-page', MyPage, props)
    ↓
ReadableStream<string>
    ├── chunk 1: <!DOCTYPE html><html><head>...</head><body>
    ├── chunk 2: <my-header><template shadowrootmode="open">...</template></my-header>
    ├── chunk 3: <main>...</main>
    ├── chunk N: <my-footer><template shadowrootmode="open">...</template></my-footer>
    └── chunk N+1: </body></html>

HTTP Response:
  Transfer-Encoding: chunked
  Content-Type: text/html; charset=utf-8
```

## Priority Ordering

Components are rendered in priority order:

| Priority  | Components                 | Rationale                   |
| --------- | -------------------------- | --------------------------- |
| 1 (first) | Above-fold, critical path  | Minimize FCP/LCP            |
| 2         | Main content               | Structural HTML             |
| 3         | Below-fold                 | Deferred, visible on scroll |
| 4 (last)  | `client:only` placeholders | No DSD to render            |

Priority is determined by:

1. Explicit `renderPriority` metadata on the component
2. Position in document order (earlier = higher)
3. `client:visible` strategy components deferred to priority 3

## Error Handling

Unlike the synchronous `renderDsd()` which fails the entire page on any error,
streaming mode isolates failures:

```ts
renderDSDStream('my-page', MyPage, props) {
  for (const component of page.components) {
    try {
      yield renderComponent(component);
    } catch (e) {
      // Emit bare tag + error marker, continue with next component
      yield `<${component.tagName} data-render-error="${escapeHtml(e.message)}"></${component.tagName}>`;
      reportError(component, e);
    }
  }
}
```

## Why Not Just Use HTTP/2 Server Push?

HTTP/2 Push is deprecated. Streaming via `ReadableStream` + `Transfer-Encoding:
chunked` works on HTTP/1.1, HTTP/2, and HTTP/3 without protocol-specific APIs.

## Limitations

- Only applicable to ISR/request-time rendering (SSG is static files)
- Requires DSD-capable browser (Chrome 111+, Safari 16.4+, Firefox 123+)
- `Transfer-Encoding: chunked` requires a server that supports it (CF Workers, Deno, Node all do)
- Component render order within a priority tier is document-order (not optimized for dependency chains)

## Consequences

### Positive

- TTFB drops from full-page-render-time to ~5ms (shell only)
- Browser can parse DSD incrementally — earlier FCP
- One slow component doesn't block the page
- Metrics track per-component render time for optimization
- Composes with Signals (ADR-0039): reactive chunks re-render independently

### Negative

- Streaming API is different from sync API — two code paths in renderer
- Debugging streaming responses is harder than inspecting a single HTML string
- Priority ordering may not match actual visual importance without manual tuning

## Related

- ADR-0033: Renderer Kernel (timing-independent `renderDsd`)
- ADR-0039: DsdElement + Signals
- `renderDsd()` in `@lessjs/core`
