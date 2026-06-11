# v0.37.6 NextVersion

v0.37.6 proves the Vite + Nitro runtime path introduced by ADR-0096 and
prepared in v0.37.5.

The release goal is not to replace openElement rendering or route semantics.
The goal is to prove that Nitro can own production server runtime, deployment
output, platform presets, asset handling, and cache/runtime plumbing while
openElement continues to own application, component, render, island, and route
contracts.

## Scope

### Runtime Proof

- [x] generate or expose an openElement universal request handler;
- [x] add the first Nitro mount boundary for converting a Nitro-like event to a
      Web `Request` and returning Web `Response` data;
- [ ] mount that handler in a real Nitro server entry;
- build a minimal proof application through Vite + Nitro;
- prove Node output;
- prove Cloudflare Workers output.

### openElement Semantics to Preserve

- `definePage()` authoring;
- file routes;
- `load()` data flow;
- layouts;
- error, redirect, and not-found behavior;
- API routes;
- shadow/DSD default render mode;
- explicit light DOM opt-in;
- static zero-JS routes;
- explicit island JS only when hydration/client-only behavior is requested.

### Nitro Mapping

- static assets map to Nitro output;
- island chunks remain Vite client build assets referenced by openElement HTML;
- ISR/cache intent maps to Nitro cache or route rules only through documented
  adapter semantics;
- Hono remains an implementation detail where useful, not the product identity.

## Current Evidence

- `@openelement/protocols/runtime` defines `OpenElementRequestHandler` and
  `createRuntimeAdapter`.
- Generated SSG/Hono entries export `openElementHandler` and
  `openElementRuntimeAdapter`.
- `@openelement/adapter-vite/nitro-mount` exposes
  `createOpenElementNitroHandler`, which preserves the Web Request/Response
  boundary and passes runtime context through the protocol.
- `deno task nitro:proof:node` and `deno task nitro:proof:workers` currently
  prove the mount boundary. They are not yet a substitute for real Nitro output
  proof.

## Non-Goals

- No public package reset.
- No final v1 API freeze.
- No built-in database, auth, or ORM.
- No requirement that users author Nitro routes directly.
- No replacement of Web Components as the default component model.

## Related

- SOP: `docs/sop/v0.37.6/README.md`
- Proof plan: `docs/next/v0.37.6/PROOF_PLAN.md`
- ADR: `docs/adr/ADR-0096-protocol-first-vite-nitro-runtime.md`
- ADR: `docs/adr/ADR-0098-entry-descriptor-route-manifest-contract.md`
- Previous line: `docs/next/v0.37.5/`
