# v0.37.6 Design

## Runtime Model

v0.37.6 proves the default runtime direction from ADR-0096 with real evidence:
openElement owns application semantics, route semantics, Web Components output,
island metadata, render modes, and cache intent; Vite and Nitro provide the
default build and deployment engine.

The target shape is:

```ts
const handler = createOpenElementHandler(appManifest);
export default nitroMount(handler);
```

The public user path must remain openElement authoring. Users should not need
to author Nitro routes to use openElement pages, API routes, islands, SSR, SSG,
or ISR.

## Boundaries

| Surface    | openElement owns                         | Nitro/Vite owns                      |
| ---------- | ---------------------------------------- | ------------------------------------ |
| Authoring  | pages, layouts, load, API route contract | no authoring contract                |
| Components | Web Components, DSD/shadow, light opt-in | no component model                   |
| Routing    | route manifest and generated handler     | server event delivery                |
| Rendering  | HTML, islands, static zero-JS semantics  | production server output             |
| Assets     | island/chunk intent and references       | emitted assets and serving           |
| Runtime    | universal request handler                | Node/Workers preset wrappers         |
| Cache      | ISR/cache intent                         | Nitro cache or route-rule primitives |
| Deployment | provider-neutral contract                | preset-specific bundles and adapters |

## Implementation Slices

1. Expose a universal request handler from the generated route pipeline.
2. Add an openElement-to-Nitro mount boundary using Web Request/Response.
3. Replace the mount-only proof with real Nitro Node output.
4. Add Cloudflare Workers output proof.
5. Verify static assets, island chunks, zero-JS static routes, and explicit
   island JavaScript.
6. Verify route behavior for `load()`, layouts, redirects, not-found, errors,
   and API routes.
7. Map ISR/cache intent to tested Nitro primitives or document blockers.

## Non-Substitution Rule

Nitro is allowed to remove adapter workload. It is not allowed to replace the
openElement route, render, component, island, light/shadow, or protocol
contracts. Any shortcut that only proves Nitro can run a generic server is not
v0.37.6 proof.
