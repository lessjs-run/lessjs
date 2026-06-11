# v0.37.6 Vite + Nitro Runtime Proof Plan

## Goal

Prove that Nitro can own production runtime and deployment output while
openElement keeps route, render, island, component, DSD/light, and data/cache
semantics.

This is a proof plan, not a public API freeze. The default user path remains
`openElement()`.

## Universal Request Handler

The v0.37.6 runtime proof uses the protocol shape from
`@openelement/protocols/runtime`:

```ts
interface RuntimeAdapter {
  name: string;
  fetch(request: Request, context?: RuntimeContext): Response | Promise<Response>;
}
```

The openElement handler must:

- accept a Web `Request`;
- return a Web `Response`;
- receive environment/platform/cache through context, not global process state;
- consume route semantics from the ADR-0098 EntryDescriptor contract;
- keep Hono, Nitro, Node, Workers, and Deno details outside authoring APIs.

## Proof App

The proof app must include:

- one static page with no island and no explicit client hydration;
- one page with `load()` data;
- one page using layout/app-shell wrapping;
- one page that redirects;
- one not-found path;
- one error path;
- one API route;
- one explicit island with `hydrate: "visible"` or `hydrate: "idle"`;
- one client-only island with `hydrate: "only"`;
- one ISR/cache-intent route.

## Nitro Mount

The Nitro server entry must:

- import or receive the openElement universal request handler;
- convert Nitro events to Web `Request` objects only at the boundary;
- return Web `Response` output back through Nitro;
- expose static public assets through Nitro output;
- preserve openElement-generated HTML without Nitro rewriting component output.

## Asset And Island Mapping

Validation must prove:

- static assets are present in Nitro output and resolve at runtime;
- Vite island chunks are present in Nitro output;
- generated HTML references the expected client assets;
- static pages without islands do not reference framework client JavaScript;
- pages with explicit islands reference only required island/client assets.

## ISR And Cache Mapping

ISR/cache proof must stay adapter-based:

- openElement records `revalidate` and cache key intent;
- Nitro cache/storage or route rules may implement that intent;
- failed or incomplete Nitro cache mapping is recorded as a blocker or caveat,
  not hidden behind a generic "SSR works" claim;
- no database, auth, ORM, Redis, KV, or R2 default is introduced.

## Runtime Outputs

Minimum output proof:

- Node preset smoke test;
- Cloudflare Workers preset smoke test;
- route table and asset references work in both outputs;
- output differences are documented when a feature is Node-only or
  Workers-only.

## Verification Commands

The implementation may refine exact commands, but v0.37.6 must produce
evidence equivalent to:

```bash
deno task graph:check
deno task arch:check
deno task test
deno task build
deno task nitro:proof:node
deno task nitro:proof:workers
```

JSR publish attempts remain best-effort distribution telemetry under ADR-0097
and are not proof-plan exit criteria.

## Ownership Record

The v0.37.6 evidence must explicitly classify each area:

| Area               | Owner          | Notes                                                         |
| ------------------ | -------------- | ------------------------------------------------------------- |
| Authoring API      | openElement    | `definePage`, `defineIsland`, `defineElement`, `defineLayout` |
| Route semantics    | openElement    | ADR-0098 EntryDescriptor contract                             |
| Render semantics   | openElement    | DSD/shadow default, light opt-in                              |
| Client bundling    | Vite           | Island chunks and client assets                               |
| Production runtime | Nitro          | Server entry, presets, output                                 |
| Deployment output  | Nitro          | Node and Workers proof                                        |
| Cache primitives   | Nitro/adapter  | Only through openElement cache protocol                       |
| Data/database      | adapter/recipe | No built-in default                                           |

## Exit Evidence

v0.37.6 can exit only when:

- Node and Workers runtime smokes pass or have documented blockers accepted by
  SOP;
- static zero-JS and explicit-island JS checks pass;
- `load()`, layout, redirect, not-found, error, and API route behavior pass;
- ISR/cache mapping has tests or a documented caveat;
- graph, architecture, test, and build gates pass;
- JSR state is recorded but not treated as an exit gate.
