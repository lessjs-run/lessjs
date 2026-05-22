# SOP-004: Streaming DSD

> Version: v0.21.0 (Reactive DSD)
> Priority: P1
> Depends on: SOP-001 (DsdElement + Signals)

## Objective

Enable progressive delivery of DSD pages via HTTP streaming. Instead of
waiting for the entire page to render server-side before sending the first
byte, `renderDSD()` can produce a `ReadableStream<string>` that sends each
component's DSD template as soon as it's ready.

The browser's native HTML parser can process streaming DSD chunk-by-chunk:
`<template shadowrootmode="open">` blocks are parsed incrementally, and the
shadow DOM is attached before the full page arrives.

## Architecture

```
renderDSD streaming mode:
  for each component in page:
    render component → yield DSD template chunk
  end

HTTP response:
  Content-Type: text/html; charset=utf-8
  Transfer-Encoding: chunked

  <!DOCTYPE html>
  <html><head>...</head><body>
  <my-header>
    <template shadowrootmode="open">...</template>  ← chunk 1
  </my-header>
  <main>...</main>
  <my-footer>
    <template shadowrootmode="open">...</template>  ← chunk N
  </my-footer>
  </body></html>
```

## API

```ts
// Current (v0.20): synchronous string output
const html: string = await renderDSD('my-page', MyPage, props);

// v0.21 streaming: ReadableStream<string>
const stream: ReadableStream<string> = renderDSDStream('my-page', MyPage, props);

// Usage in Hono / Deno:
return new Response(stream, {
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
});
```

## Implementation

### Phase 1: Core Streaming

- [ ] `renderDSDStream()` produces `ReadableStream<string>`
- [ ] Page shell (DOCTYPE, head, opening body) sent immediately
- [ ] Each component rendered and yielded as a chunk
- [ ] Page footer (closing body/html) sent last
- [ ] Error handling: failed component → fallback chunk + continue

### Phase 2: Priority Ordering

- [ ] Above-the-fold components rendered first (critical path)
- [ ] Below-fold components deferred (visible strategy components)
- [ ] `client:only` components: placeholder only (no DSD to stream)
- [ ] Configurable priority via `renderPriority` metadata

### Phase 3: Metrics

- [ ] Time-To-First-Byte (TTFB) — first chunk sent
- [ ] First-Contentful-Paint (FCP) — above-fold DSD complete
- [ ] Largest-Contentful-Paint (LCP) — largest component rendered
- [ ] Metrics written to `dsd-report.json` stream section

## Benefits

| Metric           | Static (v0.20)            | Streaming (v0.21)                    |
| ---------------- | ------------------------- | ------------------------------------ |
| TTFB             | After full render         | ~5ms (immediate shell)               |
| FCP              | After full render         | After above-fold components          |
| Perceived speed  | Page appears all at once  | Progressive rendering                |
| Error resilience | Single failure = 500 page | Failed component = fallback, rest OK |

## Limitations

- Browser must support Declarative Shadow DOM (Chrome 111+, Safari 16.4+, Firefox 123+)
- HTTP/1.1 `Transfer-Encoding: chunked` or HTTP/2/3 native streaming required
- No client-side JS needed for streaming itself (zero JS for Ocean components)
- Not applicable to SSG output (SSG is static files, not streaming). Streaming is for ISR/SSR.

## Verification

- `renderDSDStream()` returns `ReadableStream<string>`
- TTFB < 50ms (shell only)
- Above-fold components rendered before below-fold
- Failed component produces fallback chunk, doesn't break page
- Streaming DSD works in Chrome, Safari, Firefox DSD-capable versions
- DSD report tracks stream metrics

## Related

- ADR-0040: Streaming DSD
- SOP-001: DsdElement + Signals
- ADR-0033: Renderer Kernel (timing-independent renderDSD)
- `renderDSD()` in `@lessjs/core`
