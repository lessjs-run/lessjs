# v0.37.5 Design

## Product Model

openElement is repositioned as a Web Components application framework powered
by Vite + Nitro.

The default user path remains simple:

```ts
openElement();
```

The internal target model is modular:

```ts
openElement({
  renderer: webComponentsRenderer(),
  router: fileRouter(),
  islands: viteIslands(),
  runtime: nitroRuntime(),
  cache: nitroCache(),
});
```

The explicit public API for this object shape is not part of v0.37.5. The
release defines the protocols and conformance tests that make this shape
possible.

## Layer Boundaries

| Layer             | Default                                       | Replacement Direction                                  |
| ----------------- | --------------------------------------------- | ------------------------------------------------------ |
| Authoring         | `definePage`, `defineIsland`, `defineElement` | stable public app API                                  |
| Renderer          | openElement JSX/VNode/render-node             | React, Vue, Svelte, Lit, custom renderer               |
| Component adapter | DsdElement and custom elements                | Lit, plain custom elements, framework islands          |
| Route manifest    | file routes from `@openelement/ssg`           | manual manifest, CMS route source                      |
| Island bundling   | Vite client entries                           | framework-specific island adapter                      |
| Build             | Vite                                          | future Vite Environment API/Rolldown evolution         |
| Runtime           | Nitro                                         | Hono-only, Cloudflare-native, Node-native              |
| Cache/storage     | Nitro primitives                              | KV, R2, Redis, filesystem, memory                      |
| Deployment        | Nitro presets                                 | Vike Universal Deploy style metadata, provider adapter |

## Protocol Package Shape

`@openelement/protocols` becomes the home for runtime-free contracts. It must
not import Vite, Nitro, Hono, Deno, Node, or DOM implementation packages.

Initial protocol groups:

- `renderer`: renderer input/output and conformance runner;
- `components`: component discovery, SSR render, client entry metadata;
- `runtime`: fetch-compatible handler and prerender hooks;
- `routes`: ADR-0098 route manifest and EntryDescriptor data contracts;
- `islands`: hydration strategy and island client entry metadata;
- `cache`: cache/storage intent and ISR compatibility shapes;
- `signals`: minimal signal interoperability contracts;
- `data`: data adapter contract moved or re-exported from current package.

## Nitro Mapping

v0.37.5 only designs the Nitro mapping. v0.37.6 proves it.

Expected mapping:

| openElement Concept       | Nitro Concept                                          |
| ------------------------- | ------------------------------------------------------ |
| universal request handler | Nitro server handler                                   |
| static output             | Nitro public assets / prerendered output               |
| file routes               | generated handler route table                          |
| API routes                | server handler branches or generated Nitro routes      |
| island client chunks      | Vite client build assets referenced from response HTML |
| ISR intent                | Nitro cache / route rules after explicit mapping       |
| data recipes              | Nitro storage only through adapter boundaries          |

## Design Rules

- Nitro may be a deep default implementation, but it must not replace
  openElement route, render, component, or island semantics.
- Vite may stay the only build engine in the short term.
- Web Components remain the default component model.
- Shadow/DSD remains the default render mode; light DOM remains explicit opt-in.
- Conformance tests define what a replacement implementation must prove.

## UI Coverage Rebase

v0.37.5 preserves the v0.37.4 pure CSS foundation and does not expand the UI
product scope. The daisyUI-inspired interactive/form coverage remains a later
UI product slice after protocol/runtime proof.

Constraints retained for the deferred UI slice:

- no Tailwind runtime;
- no new dependency introduced only for UI coverage;
- CSS-first DSD-compatible components continue to use Open Props tokens and
  signal-to-host-attribute thin shells;
- protocol/runtime work must not add UI implementation scope.
