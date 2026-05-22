# SOP-005: Reactive DSD Verification + Release Gate

> Version: v0.21.0 (Reactive DSD)
> Priority: P0
> Depends on: SOP-001, 002, 003, 004

## Release Gate Commands

```sh
deno task fmt:check
deno task lint
deno task typecheck
deno task docs:check-strategy
deno task test
deno audit
deno task build
deno task dsd:check-report
deno task test:e2e
```

## Targeted Tests

```sh
# Signals + DsdElement
deno test packages/core/__tests__/dsd-element.test.ts
deno test packages/core/__tests__/signals-reactive.test.ts

# Safe templates
deno test packages/core/__tests__/safe-template.test.ts

# Streaming DSD
deno test packages/core/__tests__/streaming-dsd.test.ts

# DOM diffing
deno test packages/core/__tests__/dom-diff.test.ts

# e2e: reactive counter, template safety, streaming
deno task test:e2e
```

## Verification Checklist

### Signals

- [ ] DsdElement re-renders on signal change
- [ ] Fine-grained: only changed expression updates
- [ ] Microtask batching: N signals → 1 DOM update
- [ ] Event → signal.set() → re-render loop works

### Safe Templates

- [ ] XSS vector escaped by default
- [ ] `unsafeHTML()` passes through
- [ ] Attribute context escaping
- [ ] No double-escaping in nested templates

### DOM Diffing

- [ ] Keyed list diff preserves DOM state
- [ ] `diff()` opt-in API works
- [ ] Default (no diff) still fine-grained

### Streaming DSD

- [ ] `renderDSDStream()` produces ReadableStream
- [ ] TTFB < 50ms on local
- [ ] Failed component doesn't break stream
- [ ] Chrome/Safari/Firefox renders streaming DSD

### Regression

- [ ] Static `render(): string` still works (no signals required)
- [ ] v0.20 Ocean-Island components unchanged
- [ ] existing 755 tests pass
- [ ] DSD report: zero unknown errors from new features

## Changelog v0.21.0

- [ ] Document DsdElement + Signals integration
- [ ] Document safe templates
- [ ] Document optional DOM diffing
- [ ] Document streaming DSD
- [ ] Document API changes from v0.20.1

## Non-Goals

- Do not change the `render(): string` contract
- Do not introduce build-step template compilation
- Do not add SSR-specific streaming beyond ISR path
- Do not implement full virtual DOM

## Related

- ADR-0039: DsdElement + Signals Architecture
- ADR-0040: Streaming DSD
- v0.20 Ocean-Island baseline
