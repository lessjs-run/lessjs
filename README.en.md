# LessJS

简体中文 | [English](./README.en.md)

**Full-Stack Framework + Universal WC Rendering Engine + Registry Hub** — a full-stack development platform where Web Components are first-class citizens. Zero-JS first paint via Declarative Shadow DOM, Island architecture for on-demand interactivity, Hono + Serverless API for backend, and Registry Hub for one-click WC component discovery and installation.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-published-blue)](https://jsr.io/@lessjs/core)
[![@lessjs/core](https://img.shields.io/jsr/v/@lessjs/core?label=@lessjs/core)](https://jsr.io/@lessjs/core)

## Three-Pillar Architecture

```
LessJS
│
├── 1. Full-Stack Framework
│   ├── File-convention routing + Hono API Routes
│   ├── Dev server (Vite HMR + Hono)
│   ├── Build pipeline (SSG / ISR / SSR — same rendering engine)
│   └── Serverless deployment (CF Pages / Deno Deploy)
│
├── 2. Universal WC Rendering Engine
│   ├── DSD string rendering (renderDSD — pure string concatenation)
│   ├── Multi-framework adapters (Lit / React / Vanilla → Vue)
│   ├── Rendering-timing-agnostic (build-time / ISR / request-time)
│   └── Compatibility classification + validation
│
└── 3. Registry Hub
    ├── Package discovery + search + compatibility validation
    ├── Component preview rendering (Playwright snapshots)
    └── One-click install (less add)
```

**Not an SSG framework** — SSG is one mode of the rendering engine. `renderDSD()` is **architecturally** rendering-timing-agnostic: the same engine works at build-time (SSG), cache-expiry-time (ISR), or request-time (SSR). **Current implementation**: SSG only, ISR/SSR planned.

## Features

### Pillar 1: Full-Stack Framework

> ⚠️ Early stage: routing, dev server, and API Routes are production-ready. Hydration strategies, ISR, and SSR are planned for v0.20.
- **File-convention routing** — `app/routes/` auto-scan + Hono mounting
- **API Routes** — `app/routes/api/*.ts` → Hono sub-app, serverless deployment
- **Hono runtime** — Fetch API aligned, Deno / Node / Edge multi-runtime
- **ISR (planned)** — stale-while-revalidate cache layer, `renderDSD()` ~1-5ms natural fit

### Pillar 2: Universal WC Rendering Engine
- **Declarative Shadow DOM** — WHATWG standard, zero-JS first paint
- **Island upgrade** — client JS loaded only for interactive components (`client:load/idle/visible/only` — planned)
- **Multi-adapter** — Lit / React / Vanilla adapters, multi-framework coexistence on same page
- **Universal WC Engine** — auto-detect third-party WC packages, 4-tier compatibility classification
- **Renderer Protocol** — structured render output, error taxonomy, DSD metrics

### Pillar 3: Registry Hub
- **Package search + filtering** — discover compatible Web Component libraries
- **Compatibility validation + reporting** — check SSR capability before installing
- **Component previews** — Playwright-rendered real component snapshots
- **One-click install** — `less add @scope/pkg` auto-configuration

### General
- **Deno workspace** — pure ESM, no `package.json`
- **validate-manifest CLI** — validate CEM manifest compatibility before install
- **less add safe install** — dry-run + validation gate + plan generation

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
| `@lessjs/hub`             | Registry Hub — schema, indexer, scanner, snapshot-renderer                                 |
| `@lessjs/create`          | Project scaffold CLI                                                                       |

## Rendering Pipeline

```
render() → RenderAdapter → renderDSD() → DSD HTML → browser parses
                                                       ↓
                                            customElements.upgrade()
                                                       ↓
                                            dsd-interactive → bind hydrateEvents
```

**Rendering-timing-agnostic**: the same `renderDSD()` engine invoked at different times:

| Mode | When renderDSD() is called | Data freshness | Server required |
|------|---------------------------|----------------|-----------------|
| SSG (current) | Build time | Build-time snapshot | ❌ |
| ISR (planned) | Cache expiry | Configurable stale time | ✅ edge fn |
| SSR (far term) | Every request | Real-time | ✅ always-on |

## Third-Party Compatibility Pipeline (v0.18.x)

```
node_modules/*/custom-elements.json → CEM Parser → 4-tier classifier → SSR admission
                                                          ↓
                                              less validate-manifest (CLI)
                                                          ↓
                                              less add (safe install)
```

## Competitive Positioning

| Dimension | LessJS | Astro | Fresh | Next.js |
|-----------|--------|-------|-------|---------|
| **Positioning** | Full-stack + WC Engine + Hub | Full-stack (multi-framework) | Full-stack (Preact) | Full-stack (React) |
| **WC Native** | ✅ DSD first-class | ❌ treated as plain elements | ❌ Preact-only | ❌ |
| **First-paint JS** | 0 KB | 0 KB | ~23 KB | ~90 KB |
| **Cross-framework** | Lit/React/Vanilla coexist | Multi-framework coexist | Preact only | React only |
| **Registry** | ✅ Built-in Hub | ❌ | ❌ | ❌ |
| **Backend** | Hono + Serverless | Built-in | Oak | Built-in |

**Core differentiation**: LessJS makes DSD and Web Components the primary rendering contract, rather than an optimization layered on top of a framework-specific component model.

## Roadmap

| Version | Target                                | Status      |
| ------- | ------------------------------------- | ----------- |
| v0.15   | Renderer Kernel Protocol              | ✅ Done     |
| v0.16   | WC Package Protocol                   | ✅ Done     |
| v0.17   | Ecosystem Entry + SSR Boundary        | ✅ Done     |
| v0.18   | Universal WC Engine                    | ✅ Done     |
| v0.19   | **Registry Hub + Component Browser**   | **Current** |
| v0.20   | Islands Strategy + Full-Stack Foundation | 📋 Planned |
| v0.21   | Full-Stack Framework (ISR + Vue + Supabase) | 📋 Planned |
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
