# ADR-0099: Four-Product Matrix and Elements Reset

- Status: Accepted
- Date: 2026-06-12
- Target: v0.39.0
- Depends on: ADR-0091, ADR-0092, ADR-0096, ADR-0097

## Context

ADR-0091 established the four-product direction and ADR-0096 repositioned
openElement as a Web Components application framework powered by Vite + Nitro.
The v0.38.0 product map kept existing package names while the project proved
that the public story could be made coherent without another package reset.

The next issue is product clarity. `DsdElement` was created to protect the
shadow/DSD rendering path after the Lit migration, but it is no longer an
accurate product name. The element authoring layer now covers JSX rendering,
signals, stylesheet integration, shadow/DSD defaults, and explicit light DOM
opt-in. That scope is closer to a LitElement or FASTElement competitor than to
a DSD-only helper.

The public product matrix also needs to separate first-class products from
supporting packages. Vite, Nitro, runtime facades, adapters, and low-level
kernels are important implementation surfaces, but they should not make the
product story look like a flat package catalog.

## Decision

The stable product formula is:

```text
openElement = Elements + UI + Framework + Protocols
```

The four first-class products are:

| Product   | Primary public direction                  | Product role                                                                                                         |
| --------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Elements  | `@openelement/elements`, `OpenElement`    | Native Web Components authoring layer with JSX, signals, styles, shadow/DSD defaults, and explicit light DOM opt-in. |
| UI        | `@openelement/ui`                         | First-party `open-*` components built on the Elements model.                                                         |
| Framework | `@openelement/app`, `@openelement/create` | Application shell, file routes, layouts, pages, islands, API routes, and Vite + Nitro output.                        |
| Protocols | `@openelement/protocols`                  | Runtime-free replacement boundaries and conformance contracts.                                                       |

Supporting packages are not first-class product lines:

- `@openelement/runtime` is a convenience facade and migration bridge.
- `@openelement/core` is the advanced runtime kernel.
- `@openelement/adapter-vite` is the Framework engine bridge for Vite + Nitro.
- `@openelement/signals`, `@openelement/style-sheet`, `@openelement/router`,
  `@openelement/content`, `@openelement/i18n`, and `@openelement/ssg` are
  advanced supporting packages.
- Adapter packages are ecosystem integration points.
- Hub, RPC, CEM, and compat-check remain internal, archived, or tooling
  surfaces unless a later ADR changes their status.

`OpenElement` is the intended public base-class name for the Elements product.
`DsdElement` is superseded as product terminology. v0.39 may plan a breaking
0.x migration and must record migration notes before removing or renaming any
public API. This ADR does not require a long-term `DsdElement` compatibility
alias.

`@openelement/elements` is approved as the future Elements package name. The
implementation must update package count, release order, import maps, docs, and
graph checks when the package is introduced.

For heavy framework islands, v0.39 only targets a Vue adapter proof. React is
not expanded in this line. Web Awesome is out of scope for this ADR, v0.39
templates, and the current UI strategy.

## Consequences

### Positive

- The public story is a platform with four products, not a flat list of
  packages.
- The Elements product can compete directly with Lit and FAST without being
  constrained by the DSD-only `DsdElement` name.
- UI becomes the proof surface for first-party Elements, not a wrapper around
  an external component library.
- Framework work can keep using Vite + Nitro as default engines without making
  those engines the product identity.
- Protocols remain the replacement boundary that makes the platform
  detachable.

### Neutral

- `@openelement/runtime` and `@openelement/core` remain useful, but their
  product roles become supporting rather than primary.
- Historical docs can continue to describe `DsdElement` where they record past
  implementation work.

### Negative

- The package graph grows when `@openelement/elements` and
  `@openelement/adapter-vue` are implemented.
- A breaking rename from `DsdElement` to `OpenElement` requires careful
  migration notes and release evidence.
- Public docs and automation must guard against stale package-line and active
  version claims.

## Non-Goals

- Do not implement `@openelement/elements` in this ADR-only update.
- Do not implement `@openelement/adapter-vue` in this ADR-only update.
- Do not introduce Web Awesome as a default or recommended UI substrate.
- Do not expand the React adapter in v0.39.
- Do not rename `@openelement/protocols` to `@openelement/protocol`.
- Do not present Vite or Nitro as first-class openElement products.

## Related

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0092: DsdElement Render Mode Contract.
- ADR-0096: Protocol-First Vite + Nitro Runtime Architecture.
- ADR-0097: historical JSR Best-Effort Release Gate.
- ADR-0100: JSR Publish Exit Gate Restored.
- `docs/next/v0.39.0/`
