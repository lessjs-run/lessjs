# ADR-0037: DSD-First Strategic Boundary and v0.21 Roadmap Realignment

- Status: ACCEPTED
- Date: 2026-05-22
- Related: ADR-0033, ADR-0036, SOP-015

## Context

LessJS has accumulated three valid but differently mature product claims:

1. Full-stack framework: file routes, Hono API routes, dev server, build pipeline.
2. Universal Web Components rendering engine: Declarative Shadow DOM, adapters,
   compatibility admission, DSD reports.
3. Registry Hub: package discovery, validation evidence, previews, and `less add`.

After v0.20.0, the strongest delivered capability is not generic full-stack
parity with mature React/Vue frameworks. It is the DSD-first Web Components
engine: `DsdElement`, SSR-safe `StyleSheet`, `renderDSD()`, CSS Parts,
compatibility reports, and enforceable DSD quality gates.

The public docs still described v0.18 or v0.19 as the current milestone in
some places and treated v0.20 as future work. That drift creates an avoidable
trust problem for users and maintainers.

## Decision

LessJS will present itself as:

> A DSD-first Web Components application framework with a standards-first
> rendering engine, progressive islands, Hono API routes, and a Registry Hub.

The public boundary is:

- Current stable center: SSG + DSD rendering + DsdElement-based UI + validated
  Web Components admission.
- Current framework surface: file routes, dev/build pipeline, Hono API routes,
  content/i18n plugins, package islands.
- Next framework work: hydration strategies, ISR, request context, deployment
  parity, and signal-driven DOM updates.
- Deferred work: generic request-time SSR, auth/database integrations,
  publisher accounts, package signing, and broad marketplace claims.

LessJS must not imply that it already replaces mature full-stack frameworks
for all dynamic application use cases. It may compare itself to those
frameworks only through explicit dimensions: DSD-first output, Web Components
native support, island upgrade model, and Registry Hub evidence.

## Product Positioning Rules

1. Say "DSD-first" before "full-stack" when describing the current product.
2. Treat SSG as the current production rendering mode.
3. Describe ISR and request-time SSR as planned work until shipped and gated.
4. Describe Hydration strategy support as planned user-facing directives until
   `client:load`, `client:idle`, `client:visible`, and `client:only` are
   implemented in dev and build.
5. Treat Registry Hub as an evidence pipeline with early-access package count,
   not as a mature marketplace.
6. Publish package-version differences as staggered package release state
   instead of hiding them behind a single project version.
7. Keep docs falsifiable: if a capability has no command, test, or generated
   artifact proving it, it belongs in Roadmap, not Features.

## Roadmap Realignment

v0.20.x is now the Ocean-Island and repository cleanup line:

- `DsdElement` replaces `DsdLitElement` for DSD components.
- `StyleSheet` handles CSSStyleSheet use across browser and SSR environments.
- `@lessjs/ui` is DSD-native except the retained Lit island example.
- DSD report gates fail on unknown error classes and excess hard errors.

v0.21.x becomes the Reactive DSD line:

- `DsdElement` + Signals integration.
- Safe HTML template helpers with automatic escaping.
- Streaming DSD as the request-time rendering primitive.
- No DOM diff in core; simple bindings patch directly, complex stateful UI
  remains an Island responsibility.

v0.22.x becomes the Edge Full-Stack line:

- ISR production handler.
- KV-backed ISR adapters for Cloudflare Workers and Deno KV.
- www self-hosting proof with Showcase, ISR demo, and Hono API route.
- Deployment guides for static-only, Cloudflare Workers, and Deno Deploy.

v1.0 freezes the contracts that are already proven:

- `DsdElement`
- `renderDSD()`
- adapter protocol
- manifest schema
- `dsd-report.json`
- `less validate-manifest`
- `less add`

## Consequences

Positive:

- Public docs become more credible because shipped and planned capabilities are
  separated.
- The strongest moat is easier to explain: DSD engineering plus WC admission,
  not generic full-stack breadth.
- Future roadmap work has sharper exit criteria.

Negative:

- The short-term marketing claim becomes narrower.
- Some existing docs and homepage copy need to be rewritten.
- Full-stack parity with larger frameworks remains explicitly unfinished.

Neutral:

- This does not remove the full-stack ambition. It sequences it after the DSD
  engine and island strategy are credible.
- Existing v0.15-v0.20 ADRs remain valid; this ADR changes public emphasis and
  roadmap order, not the already shipped implementation.

## Verification

Docs that mention current version, current rendering mode, full-stack status,
Hydration strategy status, Registry Hub maturity, or v0.20/v0.21 scope must be
checked against this ADR during release closure.

Run `deno task docs:check-strategy` before release closure. The task blocks
known stale version claims, over-shipped Hydration/ISR/SSR claims, and mature
marketplace wording in the primary public documentation surface.
