# LessJS

[简体中文](./README.md) | [English](./README.en.md)

LessJS is a Deno-first Web Components framework for **SSR/SSG with Declarative
Shadow DOM**. It renders HTML before JavaScript, then upgrades only the
interactive islands that actually need browser APIs.

The current project is a working early framework, not a mature registry
ecosystem. The roadmap is intentionally protocol-first: stabilize the renderer
kernel, define a Custom Elements Manifest-compatible package protocol, then build
a local registry index before any public WC hub.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-published-blue)](https://jsr.io/@lessjs/core)
[![@lessjs/core](https://img.shields.io/jsr/v/@lessjs/core?label=core&style=flat-square)](https://jsr.io/@lessjs/core)
[![@lessjs/ui](https://img.shields.io/jsr/v/@lessjs/ui?label=ui&style=flat-square)](https://jsr.io/@lessjs/ui)

## What LessJS Is

LessJS is best understood as a Web Standards-first rendering stack:

- **Engine**: `renderDSD()`, nested custom element rendering, route rendering,
  SSG output, DSD render metrics, and adapter hooks.
- **Protocol**: package island metadata today; a CEM-compatible WC package
  manifest on the roadmap.
- **Ecosystem**: local package indexing, validation artifacts, install helpers,
  and eventually a public WC registry hub.

LessJS does not promise to SSR every arbitrary Web Component. Automatic install,
registration, rendering, and hydration are only reliable for packages that expose
an explicit manifest and pass validation.

## Package Overview

| Package                | Version | Role                                               | External deps             |
| ---------------------- | ------- | -------------------------------------------------- | ------------------------- |
| `@lessjs/core`         | 0.14.9  | DSD renderer, islands, navigation, errors, logging | `parse5`                  |
| `@lessjs/adapter-vite` | 0.14.9  | Vite orchestration, route scan, SSG, island chunks | `vite`, `hono`, `esbuild` |
| `@lessjs/adapter-lit`  | 0.14.9  | Lit `TemplateResult` to DSD HTML bridge            | `lit`                     |
| `@lessjs/app`          | 0.14.9  | Recommended `lessjs()` umbrella entry              | workspace packages        |
| `@lessjs/content`      | 0.14.9  | Blog, nav, sitemap build plugins                   | `marked`, `gray-matter`   |
| `@lessjs/i18n`         | 0.14.9  | Locale expansion and route helpers                 | none                      |
| `@lessjs/ui`           | 0.14.9  | LessJS Web Components and package islands          | `lit`                     |
| `@lessjs/signals`      | 0.14.9  | Signals helpers and island effects                 | none                      |
| `@lessjs/rpc`          | 0.14.9  | Fetch-based RPC controller                         | none                      |
| `@lessjs/create`       | 0.14.9  | Project scaffold CLI                               | none                      |

## Rendering Pipeline

```text
Route module or Web Component
  -> render() returns string or Lit TemplateResult
  -> renderDSD() emits Declarative Shadow DOM HTML
  -> nested custom elements are rendered through parse5-backed expansion
  -> SSG writes static HTML and island assets
  -> browser parses <template shadowrootmode="open">
  -> Custom Elements upgrade existing hosts
  -> dsd-interactive components bind declared hydrateEvents
```

The stable current model is SSG-first. ISR, edge SSR, a multi-adapter matrix, and
a public registry hub are roadmap items, not current production guarantees.

## Quick Start

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app
deno task dev
deno task build
```

Requirements:

- Deno 2.7+
- A modern browser with Declarative Shadow DOM support

## Roadmap Boundary

The realistic path is:

1. **Renderer kernel**: harden DSD rendering, adapter contracts, route rendering,
   metrics, and package island SSR.
2. **WC package protocol**: extend `PackageIslandMeta` toward a
   Custom Elements Manifest-compatible schema with `ssr`, `dsd`, `hydrate`, and
   diagnostics fields.
3. **Local registry index**: scan installed/workspace packages, validate
   manifests, and show SSR/SSG output, bundle cost, docs completeness, and test
   status.
4. **Install automation**: `less add <package>` can update config and generated
   registration only for validated packages.
5. **Public hub**: publish reproducible manifests and validation reports after
   provenance, review, reporting, and security response rules exist.

## Standards Positioning

LessJS follows the platform where it is already useful and treats emerging
standards as explicit roadmap boundaries:

- WHATWG HTML defines Declarative Shadow DOM attributes such as
  `shadowrootmode`, `shadowrootdelegatesfocus`, `shadowrootclonable`,
  `shadowrootserializable`, and `shadowrootcustomelementregistry`.
- Custom Elements Manifest provides the metadata base for tags, attributes,
  properties, events, slots, CSS parts, CSS custom properties, and custom states.
- Open UI is used as vocabulary for parts, states, behaviors, accessibility, and
  form semantics, not as a toolchain dependency.
- OpenWC is useful ecosystem history for testing, linting, demoing, and
  publishing conventions, but LessJS keeps Deno, Playwright, and self-hosted SSG
  as its validation mainline.
- Lit and FAST prove that Web Components can support real component authoring;
  LessJS should integrate through adapters and manifests rather than assume one
  authoring library.
- Scoped Custom Element Registries and CSS Houdini are tracked as future
  integration surfaces, not current core promises.

## Key Docs

- [Roadmap](www/app/routes/roadmap.ts)
- [Standards-first renderer ADR](www/content/blog/0024-standards-first-wc-renderer-roadmap.md)
- [Renderer kernel / registry SOP](www/app/routes/zh/decisions/20260515-1-renderer-kernel-registry-sop.ts)
- [Architecture guide](www/app/routes/guide/architecture.ts)
- [Standards & registry guide](www/app/routes/guide/standards-registry.ts)
- [DSD guide](www/app/routes/guide/dsd.ts)
- [Island guide](www/app/routes/guide/islands.ts)
- [API reference](www/app/routes/reference/core.ts)
- [v0.14.9 changelog](deliverables/review260516/CHANGELOG-v0.14.9.md)

## License

MIT
