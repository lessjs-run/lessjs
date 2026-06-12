# v0.38.0 Product Map

This is the v0.38.0 product surface target derived from:

- `docs/next/v0.38.0/PACKAGE_SURFACE_INVENTORY.md`
- `docs/next/v0.38.0/PRODUCT_SURFACE_CLASSIFICATION.md`
- `docs/sop/v0.38.0/README.md`
- `docs/arch/current-architecture.md`

## Decision

v0.38.0 keeps the current package names. It does not introduce
`@openelement/elements`, `@openelement/protocol`, or
`@openelement/framework`.

Reason: each new top-level package name requires ADR approval, and the current
package graph already supports the four-product model through existing packages
and subpaths. v0.38.0 should first make the public story coherent before moving
files or adding package names.

## Four Product Surfaces

| Product surface | Primary packages                                                   | Public story                                                                                                    |
| --------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Elements        | `@openelement/runtime`, advanced `@openelement/core`               | Author DSD-first Web Components with JSX, signals, style sheets, and explicit render contracts.                 |
| UI              | `@openelement/ui`                                                  | Use prebuilt `open-*` components that stay independent from framework routing and app state.                    |
| Protocols       | `@openelement/protocols`                                           | Share runtime-free contracts, conformance shapes, route/build contracts, and validator types.                   |
| Framework       | `@openelement/app`, `@openelement/app/vite`, `@openelement/create` | Build generated openElement apps with pages, islands, layouts, Vite config, SSG/SSR/ISR, and starter templates. |

## Supporting And Advanced Surfaces

| Surface                        | Classification | Placement                                                                   |
| ------------------------------ | -------------- | --------------------------------------------------------------------------- |
| `@openelement/adapter-vite`    | advanced       | Build reference and CLI docs, not first-run product docs.                   |
| `@openelement/content`         | advanced       | Optional framework feature docs.                                            |
| `@openelement/i18n`            | advanced       | Optional framework feature docs.                                            |
| `@openelement/router`          | advanced       | Route helper reference until direct client routing is a documented product. |
| `@openelement/signals`         | advanced       | Reactive primitive reference; ordinary examples use `runtime`.              |
| `@openelement/style-sheet`     | advanced       | Styling runtime reference; ordinary examples use `runtime`.                 |
| `@openelement/adapter-lit`     | advanced       | Adapter ecosystem docs.                                                     |
| `@openelement/adapter-react`   | advanced       | Adapter ecosystem docs.                                                     |
| `@openelement/adapter-vanilla` | advanced       | Adapter ecosystem docs.                                                     |

## Internal And Archived Surfaces

| Surface                     | Classification | v0.38 handling                                                                                      |
| --------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| `@openelement/ssg`          | internal       | Keep package for build graph; remove from primary product tables unless an advanced guide needs it. |
| `@openelement/cem`          | internal       | Keep package for tooling; avoid tutorial exposure.                                                  |
| `@openelement/compat-check` | internal       | Keep package for tooling; avoid tutorial exposure.                                                  |
| `@openelement/rpc`          | archived       | Keep published package; do not present as v1 product without a new product story.                   |
| `@openelement/hub`          | archived       | Keep package graph presence; remove from primary docs until registry scope resumes.                 |

## Docs Contract

Root README and README.zh should present only these primary product rows:

- `@openelement/create`
- `@openelement/app`
- `@openelement/app/vite`
- `@openelement/runtime`
- `@openelement/core` as the advanced kernel
- `@openelement/ui`
- `@openelement/protocols`

Advanced docs may introduce `adapter-vite`, `content`, `i18n`, `router`,
adapter packages, `signals`, and `style-sheet` where the user task requires
them.

Primary docs should not present `hub`, `ssg`, `cem`, `compat-check`, or `rpc` as
v1 product packages.

## Create Template Contract

Generated starter projects should keep the authoring imports small:

- route and island APIs from `@openelement/app`;
- Vite facade from `@openelement/app/vite`;
- component primitives from `@openelement/runtime`;
- JSX runtime mapping through `@openelement/core/jsx-runtime`;
- UI components through `@openelement/ui` and component subpaths.

Protocol subpath aliases and direct `adapter-vite` CLI task ownership should be
minimized or hidden unless the generated project needs them for a proven local
build path.

## Hub Disposition

Hub is archived for the v0.38/v1 public product map.

This does not delete `@openelement/hub` from the package graph. It means:

- root docs stop presenting Hub as a primary product;
- generated starter projects do not mention Hub;
- Hub package docs can remain as historical/tooling reference;
- new Hub product work requires a fresh roadmap entry and ADR.

## Package Name Policy

No new top-level package name is approved in v0.38.0.

| Candidate                | v0.38 result                                             |
| ------------------------ | -------------------------------------------------------- |
| `@openelement/elements`  | defer; needs ADR and migration plan                      |
| `@openelement/protocol`  | defer; needs ADR and compatibility plan from `protocols` |
| `@openelement/framework` | defer; needs ADR and package graph plan                  |

## Implementation Order

1. Align root README and README.zh product tables.
2. Align `docs/arch/current-architecture.md` package count and layer labels.
3. Align `@openelement/create` template imports and generated tasks.
4. Align package READMEs for internal and archived packages.
5. Re-run graph, architecture, docs, generated consumer, E2E, and publish
   dry-run gates before package bump.
