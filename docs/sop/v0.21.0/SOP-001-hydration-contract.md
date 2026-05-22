# SOP-001: Hydration Contract

> Version: v0.21.0\
> Phase: Contract\
> Priority: P0\
> Status: PLANNED

## Objective

Define the public hydration contract before changing scanner, build, or runtime
code. The contract must be small, explicit, and compatible with v0.20's
DSD-first default.

## Directives

| Directive        | Meaning                          | SSR behavior                | Client behavior                      |
| ---------------- | -------------------------------- | --------------------------- | ------------------------------------ |
| `client:load`    | hydrate as soon as runtime loads | SSR/DSD allowed             | import immediately                   |
| `client:idle`    | hydrate when browser is idle     | SSR/DSD allowed             | import via `requestIdleCallback`     |
| `client:visible` | hydrate near viewport entry      | SSR/DSD allowed             | import via `IntersectionObserver`    |
| `client:only`    | render only in browser           | SSR import must be excluded | import immediately and render client |

## Source Forms

Support two equivalent authoring paths:

1. Template directive syntax in route output:

```html
<my-counter client:visible></my-counter>
```

2. Island metadata in TypeScript:

```ts
export default island('my-counter', MyCounter, {
  strategy: 'visible',
});
```

The build pipeline must normalize both into one internal strategy model.

## Internal Type

Add or confirm a shared strategy type:

```ts
export type HydrationStrategy = 'load' | 'idle' | 'visible' | 'only';
```

Mapping from older island strategy names:

| Existing value | v0.21 strategy |
| -------------- | -------------- |
| `eager`        | `load`         |
| `lazy`         | `idle`         |
| `idle`         | `idle`         |
| `visible`      | `visible`      |
| `dsd: false`   | `only`         |

## Diagnostics

Every island admission record should include:

- tag name
- module path
- strategy
- source (`directive`, `island-options`, `manifest`, `default`)
- SSR decision (`ssr`, `client-only`, `excluded`)
- reason

## Non-Goals

- Do not add framework-specific syntax.
- Do not add partial hydration of arbitrary DOM nodes.
- Do not introduce a compiler-only feature that cannot be represented in the
  island manifest.

## Verification

- Type tests cover the normalized strategy union.
- Unit tests verify directive and metadata normalization.
- Docs examples use all four directive names.
