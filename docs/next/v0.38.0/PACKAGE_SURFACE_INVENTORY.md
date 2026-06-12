# v0.38.0 Package Surface Inventory

This inventory records the current v0.37.6 package surface before the v0.38.0
product surface reset. It is evidence for classification, naming, docs, and
template decisions; it is not itself a final product map.

## Sources

- Package manifests: `packages/*/deno.json`
- Root docs: `README.md`, `README.zh.md`
- Generated project surface: `packages/create/cli.ts`
- Current architecture docs: `docs/arch/current-architecture.md`

## Package Roles

| Package                        | Current role                                                      | Initial v0.38 classification seed |
| ------------------------------ | ----------------------------------------------------------------- | --------------------------------- |
| `@openelement/app`             | JSX page, island, layout, and Vite configuration facade           | product                           |
| `@openelement/runtime`         | authoring-friendly runtime convenience facade                     | product                           |
| `@openelement/core`            | DSD renderer, JSX runtime, VNode, and kernel utilities            | product kernel                    |
| `@openelement/ui`              | DSD-first `open-*` component library                              | product                           |
| `@openelement/adapter-vite`    | Vite adapter, SSG orchestration, Nitro mount path, and build CLIs | advanced product subpath owner    |
| `@openelement/protocols`       | runtime-free shared protocol and build contracts                  | product contract layer            |
| `@openelement/signals`         | signal facade over `alien-signals`                                | product                           |
| `@openelement/style-sheet`     | `CSSStyleSheet` browser/SSR abstraction                           | product infrastructure            |
| `@openelement/ssg`             | route scanning, SSG rendering, and generated entry support        | advanced/internal candidate       |
| `@openelement/content`         | markdown, MDX, nav, blog, and sitemap helpers                     | advanced product                  |
| `@openelement/i18n`            | locale data and static path helpers                               | advanced product                  |
| `@openelement/router`          | client and route helper utilities                                 | product or advanced candidate     |
| `@openelement/rpc`             | small RPC/fetch primitive package                                 | archived or advanced candidate    |
| `@openelement/adapter-lit`     | Lit adapter and SSR bridge                                        | adapter ecosystem                 |
| `@openelement/adapter-react`   | React adapter and SSR bridge                                      | adapter ecosystem                 |
| `@openelement/adapter-vanilla` | vanilla adapter and SSR bridge                                    | adapter ecosystem                 |
| `@openelement/cem`             | custom elements manifest parser/reader                            | internal or advanced candidate    |
| `@openelement/compat-check`    | custom-element compatibility classifier                           | internal or advanced candidate    |
| `@openelement/hub`             | registry metadata, validation, and submission tooling             | archived or deferred candidate    |
| `@openelement/create`          | project generator and template publisher                          | product tooling                   |

## Public Exports

| Package                        | Exports                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@openelement/adapter-lit`     | `.`, `./ssr`                                                                                                                                                                                                                                                                                                                            |
| `@openelement/adapter-react`   | `.`, `./dsd-hydration`, `./ssr`                                                                                                                                                                                                                                                                                                         |
| `@openelement/adapter-vanilla` | `.`, `./dsd-hydration`, `./ssr`                                                                                                                                                                                                                                                                                                         |
| `@openelement/adapter-vite`    | `.`, `./build-context`, `./cli/build`, `./cli/build-client`, `./cli/build-ssg`, `./head-injection`, `./nitro-mount`, `./optional-package-stubs`, `./plugin`, `./plugin-mdx`, `./subpath-resolver`                                                                                                                                       |
| `@openelement/app`             | `.`, `./vite`                                                                                                                                                                                                                                                                                                                           |
| `@openelement/cem`             | `.`, `./types`                                                                                                                                                                                                                                                                                                                          |
| `@openelement/compat-check`    | `.`                                                                                                                                                                                                                                                                                                                                     |
| `@openelement/content`         | `.`, `./blog-data`, `./mdx`, `./nav`, `./nav-data`, `./sitemap`                                                                                                                                                                                                                                                                         |
| `@openelement/core`            | `.`, `./context`, `./data`, `./dsd-hydration`, `./errors`, `./island-transform`, `./isr`, `./isr-runtime`, `./jsx-dev-runtime`, `./jsx-runtime`, `./logger`, `./render-dsd-stream`, `./signal-context`                                                                                                                                  |
| `@openelement/create`          | `.`                                                                                                                                                                                                                                                                                                                                     |
| `@openelement/hub`             | `.`, `./builder`, `./cli/check-index`, `./cli/hub-submit`, `./cli/install-guide`, `./cli/validate`, `./indexer`, `./schema`, `./snapshot`, `./submitter`                                                                                                                                                                                |
| `@openelement/i18n`            | `.`, `./data`                                                                                                                                                                                                                                                                                                                           |
| `@openelement/protocols`       | `.`, `./build-types`, `./cache`, `./components`, `./conformance`, `./data`, `./islands`, `./renderer`, `./routes`, `./runtime`, `./signals`, `./validators`                                                                                                                                                                             |
| `@openelement/router`          | `.`, `./client-router`, `./define-routes`, `./page-loader`, `./pattern-translate`                                                                                                                                                                                                                                                       |
| `@openelement/rpc`             | `.`                                                                                                                                                                                                                                                                                                                                     |
| `@openelement/runtime`         | `.`                                                                                                                                                                                                                                                                                                                                     |
| `@openelement/signals`         | `.`, `./alien-engine`, `./framework`                                                                                                                                                                                                                                                                                                    |
| `@openelement/ssg`             | `.`                                                                                                                                                                                                                                                                                                                                     |
| `@openelement/style-sheet`     | `.`                                                                                                                                                                                                                                                                                                                                     |
| `@openelement/ui`              | `.`, `./daisy-classes`, `./daisy-classes.js`, `./open-button`, `./open-callout`, `./open-card`, `./open-code-block`, `./open-dialog`, `./open-dropdown`, `./open-hero-ping`, `./open-input`, `./open-layout`, `./open-modal`, `./open-props-tokens`, `./open-props-tokens.js`, `./open-step-card`, `./open-tabs`, `./open-theme-toggle` |

## Workspace Import Edges

| Package                        | Internal `@openelement/*` imports from manifest                                                                                                                                                                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@openelement/adapter-lit`     | `@openelement/core`, `@openelement/core/logger`                                                                                                                                                                                                                                                                   |
| `@openelement/adapter-react`   | `@openelement/core`, `@openelement/core/logger`                                                                                                                                                                                                                                                                   |
| `@openelement/adapter-vanilla` | `@openelement/core`, `@openelement/core/logger`                                                                                                                                                                                                                                                                   |
| `@openelement/adapter-vite`    | `@openelement/cem`, `@openelement/compat-check`, `@openelement/content/sitemap`, `@openelement/core`, `@openelement/core/context`, `@openelement/core/errors`, `@openelement/core/logger`, `@openelement/protocols/build-types`, `@openelement/protocols/runtime`, `@openelement/ssg`, `@openelement/style-sheet` |
| `@openelement/app`             | `@openelement/adapter-vite`, `@openelement/content`, `@openelement/core`, `@openelement/core/logger`, `@openelement/i18n`, `@openelement/protocols/islands`                                                                                                                                                       |
| `@openelement/cem`             | `@openelement/core`                                                                                                                                                                                                                                                                                               |
| `@openelement/compat-check`    | `@openelement/cem`, `@openelement/core`, `@openelement/core/types`                                                                                                                                                                                                                                                |
| `@openelement/content`         | `@openelement/core/logger`, `@openelement/protocols/build-types`                                                                                                                                                                                                                                                  |
| `@openelement/core`            | `@openelement/protocols/conformance`, `@openelement/protocols/data`, `@openelement/protocols/renderer`, `@openelement/protocols/signals`, `@openelement/signals`, `@openelement/style-sheet`                                                                                                                      |
| `@openelement/create`          | none                                                                                                                                                                                                                                                                                                              |
| `@openelement/hub`             | `@openelement/compat-check`, `@openelement/core`                                                                                                                                                                                                                                                                  |
| `@openelement/i18n`            | `@openelement/core/logger`, `@openelement/protocols/build-types`                                                                                                                                                                                                                                                  |
| `@openelement/protocols`       | none                                                                                                                                                                                                                                                                                                              |
| `@openelement/router`          | none                                                                                                                                                                                                                                                                                                              |
| `@openelement/rpc`             | none                                                                                                                                                                                                                                                                                                              |
| `@openelement/runtime`         | `@openelement/core`, `@openelement/core/jsx-runtime`, `@openelement/signals`, `@openelement/style-sheet`                                                                                                                                                                                                          |
| `@openelement/signals`         | `@openelement/protocols/signals`                                                                                                                                                                                                                                                                                  |
| `@openelement/ssg`             | `@openelement/cem`, `@openelement/compat-check`, `@openelement/core`, `@openelement/core/errors`, `@openelement/core/logger`, `@openelement/protocols/routes`, `@openelement/protocols/runtime`, `@openelement/style-sheet`                                                                                       |
| `@openelement/style-sheet`     | none                                                                                                                                                                                                                                                                                                              |
| `@openelement/ui`              | `@openelement/core`, `@openelement/signals`, `@openelement/style-sheet`                                                                                                                                                                                                                                           |

## Public Docs Exposure

The root English and Chinese READMEs currently present these as the main user
surface:

- `@openelement/create`
- `@openelement/app`
- `@openelement/app/vite`
- `@openelement/core`
- `@openelement/runtime`
- `@openelement/adapter-vite`
- `@openelement/ssg`
- `@openelement/ui`
- `@openelement/content`
- `@openelement/i18n`
- `@openelement/hub`

This exposes build internals (`adapter-vite`, `ssg`) and deferred registry work
(`hub`) as product-level concepts. v0.38.0 classification must decide whether
those remain public product packages, become advanced subpaths, or move out of
the primary documentation path.

## Create Template Exposure

`@openelement/create` currently generates direct imports for:

- authoring: `@openelement/app`, `@openelement/app/vite`,
  `@openelement/runtime`, `@openelement/core`,
  `@openelement/core/jsx-runtime`;
- UI: `@openelement/ui` and generated component subpath aliases;
- build tasks: `jsr:@openelement/adapter-vite/cli/build`,
  `jsr:@openelement/adapter-vite/cli/build-client`, and
  `jsr:@openelement/adapter-vite/cli/build-ssg`.

The v0.38.0 starter import map no longer predeclares protocol package or
protocol subpath aliases. The build tasks still invoke adapter-vite CLIs because
they are the current proven generated build path.

## Website Exposure

The `www/` source tree uses the primary product surface in guides and runtime
configuration:

- `@openelement/app`
- `@openelement/app/vite`
- `@openelement/runtime`
- `@openelement/core`
- `@openelement/ui`

The website also contains advanced, historical, or test-only references:

- `@openelement/ssg` in site tests and older roadmap copy;
- `@openelement/content` and `@openelement/i18n` in historical blog posts and
  site data infrastructure;
- `@openelement/adapter-react` and `@openelement/adapter-vanilla` in
  `www/vite.config.ts` SSR bundling config.

v0.38.0 docs work should distinguish live guide/API pages from historical blog
content before removing references.

## Immediate Classification Questions

- Should `@openelement/protocols` stay plural, or does the product map require
  an ADR for `@openelement/protocol`?
- Should `@openelement/core` remain a user-visible package, or should ordinary
  authoring docs route users through `@openelement/runtime` and
  `@openelement/app`?
- Should `@openelement/adapter-vite` and `@openelement/ssg` remain visible in
  root docs, or be documented as advanced build infrastructure?
- Should `@openelement/hub` remain in the v0.38 user surface, or be explicitly
  deferred/archived until registry scope resumes?
- Should `@openelement/router` and `@openelement/rpc` remain packages without
  root README exposure, or be classified as archived/internal until there is a
  documented product story?
