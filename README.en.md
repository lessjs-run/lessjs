# LessJS

简体中文 | [English](./README.en.md)

A Deno-first Web Components framework built on **Declarative Shadow DOM SSR/SSG +
Island Upgrade**: render crawlable, cacheable HTML first, then upgrade only the
interactive components that need browser APIs.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-published-blue)](https://jsr.io/@lessjs/core)
[![@lessjs/core](https://img.shields.io/jsr/v/@lessjs/core?label=@lessjs/core)](https://jsr.io/@lessjs/core)

## Features

- **SSG-first** — static HTML output, zero-JS first paint
- **Declarative Shadow DOM** — WHATWG standard, no framework markers
- **Island upgrade** — client JS loaded only for interactive components
- **Universal WC Engine** (v0.18.0) — auto-detect third-party WC packages, 4-tier compatibility (ssr-capable / client-only / rejected / experimental-dom)
- **validate-manifest CLI** (v0.18.1) — validate CEM manifests before install
- **less add safe install** (v0.18.2) — dry-run + validation gate + plan generation
- **DOM simulation experiment** (v0.18.3) — Happy DOM-driven SSR experiment for client-only components
- **Renderer Protocol** — structured render output, error taxonomy, DSD metrics
- **Multi-adapter** — Lit / React / Vanilla adapters
- **Deno workspace** — pure ESM, no `package.json`

## Quick Start

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app
deno task dev      # dev server
deno task build    # SSG build
```

Requirements: Deno 2.7+ / modern browser with Declarative Shadow DOM support

## Packages

| Package                   | Role                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `@lessjs/core`            | DSD renderer, Renderer Protocol, CEM parser, compatibility classifier, manifest validation |
| `@lessjs/adapter-vite`    | Vite orchestration, route scanning, SSG pipeline, CEM auto-detection                       |
| `@lessjs/adapter-lit`     | Lit TemplateResult → DSD HTML bridge                                                       |
| `@lessjs/adapter-react`   | React adapter                                                                              |
| `@lessjs/adapter-vanilla` | Vanilla JS adapter                                                                         |
| `@lessjs/app`             | Unified `lessjs()` entry                                                                   |
| `@lessjs/content`         | Blog, nav, sitemap build plugins                                                           |
| `@lessjs/i18n`            | Locale expansion and route helpers                                                         |
| `@lessjs/ui`              | Web Components library and package islands                                                 |
| `@lessjs/signals`         | Signals helpers and island effects                                                         |
| `@lessjs/rpc`             | Fetch-based RPC controller                                                                 |
| `@lessjs/create`          | Project scaffold CLI                                                                       |

## Rendering Pipeline

```
render() → RenderAdapter → renderDSD() → DSD HTML → SSG → browser parses
                                                       ↓
                                            customElements.upgrade()
                                                       ↓
                                            dsd-interactive → bind hydrateEvents
```

## Third-Party Compatibility Pipeline (v0.18.x)

```
node_modules/*/custom-elements.json → CEM Parser → 4-tier classifier → SSR admission
                                                          ↓
                                              less validate-manifest (CLI)
                                                          ↓
                                              less add (safe install)
```

## Roadmap

| Version | Target                                | Status      |
| ------- | ------------------------------------- | ----------- |
| v0.15   | Renderer Kernel Protocol              | ✅ Done     |
| v0.16   | WC Package Protocol                   | ✅ Done     |
| v0.17   | Ecosystem Entry + SSR Boundary        | ✅ Done     |
| v0.18   | **Universal WC Engine**               | **Current** |
| v0.18.0 | CEM parser + 4-tier + auto-detect     | ✅ Done     |
| v0.18.1 | validate-manifest CLI                 | ✅ Done     |
| v0.18.2 | less add safe install flow            | ✅ Done     |
| v0.18.3 | DOM simulation experiment (Happy DOM) | ✅ Done     |
| v0.19   | Registry Hub + Platform               | 📋 Planned  |
| v1.0    | API Freeze                            | 🚀 Far term |
| v1.0    | API Freeze                            | 🚀 Far term |

See [ADR docs](docs/adr/) and [lessjs.org](https://lessjs.org) for details.

## Governance Docs

```
docs/
├── adr/           Architecture Decision Records
├── changelog/     Version changelogs
├── conventions/   Coding conventions
├── sop/           Standard Operating Procedures
└── status/        Project status + review archive
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
