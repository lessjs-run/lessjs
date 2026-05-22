# SOP-004: Reactive DSD Verification + Release Gate

> Version: v0.21.0
> Priority: P0
> Status: PLANNED
> Depends on: SOP-001, SOP-002, SOP-003

## Objective

Define the exact release gate for v0.21.0. The release is complete only when
Reactive DSD, safe templates, and streaming DSD are implemented, documented,
and verified without regressing the v0.20 Ocean-Island baseline.

## Preflight

- [ ] `git status --short` is clean or unrelated dirty files are documented.
- [ ] `docs/status/STATUS.md` and `docs/roadmap/ROADMAP.md` identify v0.21.0 as
      Reactive DSD.
- [ ] No `SOP-003-optional-dom-diffing.md` remains in v0.21.0.
- [ ] New files are included in `deno task typecheck`.

## Targeted Test Commands

```sh
deno test packages/core/__tests__/dsd-element.test.ts
deno test packages/core/__tests__/reactive-dsd.test.ts
deno test packages/core/__tests__/template-events.test.ts
deno test packages/core/__tests__/safe-template.test.ts
deno test packages/core/__tests__/template-url.test.ts
deno test packages/core/__tests__/streaming-dsd.test.ts
deno test packages/core/__tests__/render-dsd.test.ts
deno test packages/signals/__tests__/signal.test.ts packages/signals/__tests__/effect.test.ts packages/signals/__tests__/batch-untracked.test.ts
```

## Full Release Gate

Run in this order:

```sh
deno task fmt:check
deno task lint
deno task typecheck
deno task docs:check-strategy
deno audit
deno task test
deno task build
deno task dsd:check-report
deno task test:e2e
```

## Feature Checklist

### DsdElement + Signals

- [ ] Static `render(): string` path unchanged.
- [ ] `render(): TemplateResult` works in CSR fallback.
- [ ] `renderDSD()` handles TemplateResult initial output.
- [ ] Signal writes schedule microtask-batched component-local rerendering.
- [ ] Attribute, boolean, property, and event bindings work.
- [ ] Microtask batching coalesces multiple signal writes.
- [ ] Signal subscriptions are cleaned up on disconnect.
- [ ] Conditional signal dependencies are retracked.

### Safe Templates

- [ ] Text interpolation escapes XSS vectors.
- [ ] Attribute interpolation cannot break out of quotes.
- [ ] URL-sensitive attributes reject dangerous protocols.
- [ ] `unsafeHTML()` is the only raw HTML escape hatch.
- [ ] Nested templates do not double-escape.
- [ ] Event handlers and property values are not serialized into HTML.

### Streaming DSD

- [ ] `renderDSDStream()` returns `ReadableStream<Uint8Array>`.
- [ ] Shell chunk is emitted first.
- [ ] Footer chunk is emitted last.
- [ ] Failed component emits fallback and stream continues.
- [ ] Stream metrics are recorded or explicitly omitted for SSG-only builds.
- [ ] Hono/Deno `new Response(stream)` usage is covered.

### Architecture Boundary

- [ ] No DOM diff API is exported.
- [ ] No virtual DOM package is introduced.
- [ ] Core remains free of Vite, Hono, Node, and npm runtime dependencies.
- [ ] Complex UI guidance points to Islands, not DOM diffing.

## Documentation Updates

- [ ] `docs/status/STATUS.md`
- [ ] `docs/roadmap/ROADMAP.md`
- [ ] `docs/changelog/v0.21.0.md`
- [ ] `docs/sop/README.md`
- [ ] Public guide/reference pages for:
  - Reactive DSD
  - Safe templates
  - Streaming DSD
  - Ocean vs Island boundaries

## Exit Criteria

- All targeted tests pass.
- Full release gate passes.
- Docs do not claim DOM diffing as v0.21 scope.
- `git status --short` contains only intentional release changes.

## Related

- SOP-001: DsdElement + Signals Integration
- SOP-002: Safe Templates
- SOP-003: Streaming DSD
