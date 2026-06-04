# ADR-0077: Structured Render IR and Single Renderer Pipeline

> Status: Accepted, Implemented\
> Date: 2026-06-03\
> Target: v0.29.0

## Context

LessJS already exposes structured render output from `renderDsd()`:

```ts
{
  html,
  errors,
  metrics,
  hydrationHints,
}
```

However, the internal renderer still has multiple string-oriented paths:

- `renderToString()` serializes VNodes directly to HTML.
- `renderDsdTree()` repeats much of that traversal while adding inline DSD
  behavior.
- `renderDsd()` accepts component `render()` results and turns them into string
  content before wrapping a DSD template.
- `rawHtml` currently mixes a trust-boundary API with sanitizer behavior.

This makes the renderer harder to reason about. Security, DSD insertion, event
markers, nested custom elements, and adapter output all cross string boundaries.

## Decision

v0.29.0 moves LessJS to a single structured renderer pipeline based on an
internal render IR.

The public `renderDsd()` output can remain `RenderOutput`, but internal
rendering should flow through one model:

```ts
type RenderNode =
  | { kind: 'text'; value: string }
  | { kind: 'element'; tag: string; attrs: RenderAttrs; children: RenderNode[] }
  | { kind: 'fragment'; children: RenderNode[] }
  | { kind: 'trusted-html'; value: string }
  | {
    kind: 'dsd-host';
    tag: string;
    attrs: RenderAttrs;
    shadow: RenderNode[];
    light: RenderNode[];
    styles?: string;
  };
```

The pipeline becomes:

```text
component render result / VNode / adapter output
  -> RenderNode IR
  -> DSD transform
  -> event marker transform
  -> HTML serializer
  -> RenderOutput
```

## Security Boundary

`@openelement/core` must not own a sanitizer dependency. Core should define trust
boundaries, not promise general-purpose HTML sanitization.

Rules:

- regular text is escaped by the serializer
- `innerHTML` without an explicit trust marker is treated as text
- trusted raw HTML is represented as `RenderNode { kind: 'trusted-html' }`
- caller-provided untrusted HTML must be sanitized before entering core
- optional sanitizer packages may exist outside core

This avoids two bad outcomes:

1. core depending on a heavy npm sanitizer package
2. core overclaiming security through incomplete regex or policy-based
   sanitization

## Consequences

Positive:

- one traversal model replaces duplicated string renderers
- HTML escaping becomes a serializer responsibility
- DSD insertion becomes a structured transform instead of string insertion
- trusted HTML has a first-class node type
- event markers and hydration hints can be produced from the same tree
- future adapters have a clearer contract

Negative:

- this is a larger renderer-kernel refactor
- existing tests around exact strings will need careful migration
- adapter output needs a deliberate conversion boundary

Mitigations:

- keep public `RenderOutput` stable during the migration
- ship the sanitizer dependency removal in v0.28.6 first
- move to IR in v0.29.0 with fixture parity tests
- keep a compatibility serializer until all internal callers use IR

## Non-Goals

- v0.29.0 does not need a new public JSX API.
- v0.29.0 does not need to change the public `renderDsd()` return shape.
- core should not bundle a general-purpose sanitizer.
- renderer IR should be internal until the API freeze decision is explicit.
