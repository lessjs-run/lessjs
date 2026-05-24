# SOP-003: Streaming DSD

> Version: v0.21.0
> Priority: P1
> Status: IMPLEMENTED
> Depends on: ADR-0040, SOP-001, SOP-002

## Objective

Add `renderDSDStream()` as the request-time DSD rendering primitive that v0.22
can use for ISR and edge handlers.

Streaming DSD must not replace SSG. SSG remains the default production path.
Streaming is for request-time regeneration, demos, and future runtime handlers.

## Public API Target

```ts
const stream = renderDSDStream(
  [
    {
      tagName: 'my-page',
      componentClass: MyPage,
      props,
      priority: 'critical',
    },
  ],
  {
    document: {
      title: 'My page',
      head: '<meta name="description" content="...">',
    },
  },
);

return new Response(stream, {
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
});
```

## Non-Goals

- Do not stream static SSG files.
- Do not implement generic request-time SSR for every route.
- Do not rely on HTTP/2 server push.
- Do not introduce framework-specific streaming semantics for Lit/React.
- Do not promise LCP improvements without browser-level measurement.

## Target Files

- `packages/core/src/render-dsd-stream.ts`
- `packages/core/src/render-dsd.ts`
- `packages/core/src/types.ts`
- `packages/core/src/index.ts`
- `packages/core/__tests__/streaming-dsd.test.ts`
- `packages/adapter-vite/__tests__/ssg-smoke.test.ts` if report schema changes

## Stream Model

```text
chunk 1: <!doctype html><html><head>...</head><body>
chunk 2: above-fold component DSD
chunk 3: main content component DSD
chunk N: below-fold component DSD or client-only placeholder
chunk N+1: </body></html>
```

Each chunk must be valid incremental HTML. The browser should be able to parse
earlier chunks before later components finish.

## Step-by-Step Execution

### Step 0: Define Stream Types

- [ ] Add `DsdStreamOptions`.
- [ ] Add `DsdStreamChunk`.
- [ ] Add `DsdStreamMetrics`.
- [ ] Add `DsdStreamError` classification that reuses existing render error
      categories where possible.

Acceptance:

- [ ] Type definitions do not pull Vite/Hono into core.
- [ ] Existing `DsdBuildReport` schema can include an optional stream section
      without breaking current report consumers.

### Step 1: Implement ReadableStream Wrapper

- [ ] Implement `renderDSDStream()` returning `ReadableStream<Uint8Array>`.
- [ ] Use `ReadableStream` controller enqueue, not Node streams.
- [ ] Emit shell first.
- [ ] Emit footer in `finally` unless shell rendering itself fails.
- [ ] Close the stream after footer.

Acceptance:

- [ ] A test can read all chunks and join valid HTML.
- [ ] First chunk is available before component render awaits finish.

### Step 2: Component Rendering Order

- [ ] Default to document order.
- [ ] Support optional `renderPriority` metadata:
  - `critical`
  - `default`
  - `defer`
- [ ] Treat `client:only` as placeholder output, not DSD render work.
- [ ] Do not reorder across explicit parent/child boundaries unless the
      component list is already flat.

Acceptance:

- [ ] Critical chunks appear before default chunks.
- [ ] Deferred chunks appear after default chunks.
- [ ] Client-only placeholders do not try to render shadow DOM.

### Step 3: Error Isolation

- [ ] If one component fails, emit a bare custom element fallback.
- [ ] Add `data-less-render-error` only when diagnostics are enabled.
- [ ] Continue streaming subsequent components.
- [ ] Record the error in stream metrics.

Acceptance:

- [ ] One failing component does not fail the whole stream.
- [ ] Error output does not inject unsanitized error text into HTML.

### Step 4: TemplateResult Support

- [ ] Ensure components returning `TemplateResult` use SOP-002 escaping.
- [ ] Ensure event/property bindings do not serialize unsafe runtime values.
- [ ] Confirm nested DSD rendering still works.

Acceptance:

- [ ] Static string component streams.
- [ ] Reactive TemplateResult component streams safe initial HTML.
- [ ] Nested custom elements stream or fallback according to existing admission
      rules.

### Step 5: Metrics

- [ ] Measure time to shell chunk.
- [ ] Measure per-component render time.
- [ ] Count streamed components, fallbacks, errors, and total bytes.
- [ ] Add optional stream metrics to DSD report output.

Acceptance:

- [ ] Tests can assert metrics exist without depending on exact timing.
- [ ] `dsd:check-report` ignores absent stream metrics for SSG-only builds.

### Step 6: Hono/Deno Usage Fixture

- [ ] Add a test or fixture that returns `new Response(stream)`.
- [ ] Verify content type.
- [ ] Verify the stream can be consumed in Deno.

Acceptance:

- [ ] `deno test packages/core/__tests__/streaming-dsd.test.ts` covers Web
      Response usage.

## Verification

```sh
deno test packages/core/__tests__/streaming-dsd.test.ts
deno test packages/core/__tests__/render-dsd.test.ts
deno task typecheck
deno task build
deno task dsd:check-report
```

Required test cases:

- [ ] `renderDSDStream()` returns `ReadableStream<Uint8Array>`.
- [ ] Shell chunk is first.
- [ ] Footer chunk is last.
- [ ] Component chunks preserve priority order.
- [ ] Failed component emits fallback and stream continues.
- [ ] TemplateResult output is escaped.
- [ ] Metrics include chunk count and error count.

## Exit Criteria

- Streaming is a proven primitive for v0.22 ISR.
- Static SSG behavior is unchanged.
- Report schema changes must be explicit and documented. When a compatibility
  constraint blocks the v0.21 stream contract, the stream contract wins.

## Related

- ADR-0040: Streaming DSD
- SOP-001: DsdElement + Signals Integration
- SOP-002: Safe Templates
