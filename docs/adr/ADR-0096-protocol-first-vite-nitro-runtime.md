# ADR-0096: Protocol-First Vite + Nitro Runtime Architecture

Status: Accepted

Date: 2026-06-12

## Context

openElement has proven a 20-package Web Components application framework with
JSX authoring, file routes, layouts, `load()`, islands, SSG, SSR/ISR contracts,
Hono API routes, a DsdElement component base, shadow/DSD defaults, and explicit
light DOM opt-in. The next architecture question is no longer whether
openElement can render applications. It is how much runtime, deployment, and
platform adapter work openElement should own.

The 2026-06-12 deployment review identified two external signals:

- Nitro already provides a Vite-integrated production server, deployment output,
  platform presets, route rules, cache/storage primitives, and multi-runtime
  deployment targets.
- Vike demonstrates a framework shape that is Vite-native, renderer-flexible,
  server-agnostic, and deployment-agnostic.

At the same time, the v0.37.4 publish recovery exposed JSR registry instability:
release truth cannot rely on a single registry status line or workflow status.
openElement should reduce self-owned deployment surface and avoid unnecessary
runtime adapter work while preserving its own application, component, render,
and protocol contracts.

## Decision

openElement will move toward a protocol-first modular architecture with
Vite + Nitro as the default base engine.

Vite and Nitro may be deep default implementation dependencies for the
application build, development, production server, and deployment pipeline:

- Vite owns module graph, plugin orchestration, client bundling, HMR, and
  environment-aware builds.
- Nitro owns production server runtime, deployment output, platform presets,
  server middleware, static asset handling, cache/storage integration, and route
  rule plumbing.

openElement owns the public application and component semantics:

- `definePage()`, `defineIsland()`, `defineElement()`, `defineLayout()`;
- file route semantics, `load()`, layouts, error/redirect/not-found behavior;
- Web Components as the default component model;
- JSX/VNode/render-node rendering;
- shadow/DSD as the default render mode;
- explicit light DOM opt-in as a first-class render mode;
- island metadata and hydration strategy semantics;
- UI tokens and `open-*` component conventions.

The protocol layer must remain frontend-framework-agnostic and
runtime-agnostic. Default implementations can be Vite, Nitro, DsdElement, and
the openElement renderer, but protocols must define replacement boundaries and
conformance tests.

Initial protocol surfaces:

```ts
export interface RendererProtocol<Input = unknown, Output = unknown> {
  render(input: Input): Promise<Output> | Output;
}

export interface ComponentAdapter<Component = unknown> {
  name: string;
  discover?(): Promise<ComponentManifest[]>;
  ssrRender?(component: Component, props: unknown): Promise<unknown> | unknown;
  clientEntry?(component: Component): ClientEntry | null;
}

export interface RuntimeAdapter {
  name: string;
  handle(request: Request, context?: unknown): Promise<Response>;
  prerender?(routes: RouteManifest): Promise<PrerenderResult>;
}

export interface CacheAdapter<Value = unknown> {
  get(key: string): Promise<Value | undefined>;
  set(key: string, value: Value, options?: CacheSetOptions): Promise<void>;
  delete?(key: string): Promise<void>;
}
```

These shapes are illustrative until v0.37.5 codifies the minimal accepted
interfaces in `@openelement/protocol`.

## Product Position

openElement is a Web Components application framework powered by Vite + Nitro.
It defaults to shadow/DSD rendering and supports explicit light DOM rendering
where composition or interoperability requires it.

The product should not be described only as "DSD-first." DSD/shadow remains the
default render mode, but Web Components application semantics are the product
identity.

## Consequences

### Positive

- openElement can stop spending roadmap budget on hand-written deployment
  presets that Nitro already maintains.
- Multi-runtime deployment becomes a default framework capability instead of a
  future adapter backlog.
- The public openElement API remains focused on components, routes, rendering,
  islands, UI, and application semantics.
- Protocols can support future React, Vue, Svelte, Lit, Hono-only,
  Cloudflare-native, or Vike-style deployment integrations without rewriting
  the core product.
- Conformance tests become the proof that a replacement renderer, component
  adapter, runtime adapter, cache adapter, or deployment adapter is real.

### Neutral

- Vite + Nitro become strategic defaults. This is intentional, not a leak.
  The architecture goal is not dependency minimalism; it is default leverage
  plus replaceable contracts.
- Hono remains a useful request/API route layer and can be used inside generated
  handlers, but Nitro becomes the primary production runtime candidate.

### Negative

- This is a larger product pivot than a simple `adapter-nitro` experiment.
  It requires roadmap, SOP, docs, and package-boundary updates.
- `@openelement/protocol` must become a real contract package rather than a
  thin type bucket.
- The project must avoid exposing Nitro-specific configuration as the primary
  user-facing API too early.

## Non-Goals

- No immediate package split or merge.
- No claim that Vite is replaceable in the short term.
- No claim that Nitro is mandatory forever.
- No React/Vue/Svelte default renderer.
- No replacement of Web Components as the default component model.
- No built-in ORM, auth platform, or database ownership.
- No JSR-only release truth assumption.

## Rollout

1. v0.37.4 remains in publish recovery until JSR package visibility and
   post-publish consumer smoke are truthful.
2. v0.37.5 becomes Protocol-First Runtime Architecture. It codifies the initial
   protocol boundaries and writes a Nitro proof plan.
3. v0.37.6 becomes the Vite + Nitro runtime proof. It proves an openElement app
   can build and deploy through Nitro without replacing openElement route,
   render, component, or island semantics.
4. v0.38.x evaluates package/product surface reset after protocol and Nitro
   evidence exists.

## Related

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0092: DsdElement Render Mode Contract.
- ADR-0093: SSR / ISR Runtime Contract.
- ADR-0095: Data / Database Boundary.
- `docs/conversation/20260612.md`: Nitro and Vike-like protocol discussion.
