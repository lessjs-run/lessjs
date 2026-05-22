# LessJS

[简体中文](./README.md) | English

**DSD-first Web Components application framework** - LessJS combines a
standards-first rendering engine, progressive islands, Hono API routes, and an
early Registry Hub for Web Component discovery and compatibility evidence.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-published-blue)](https://jsr.io/@lessjs/core)
[![@lessjs/core](https://img.shields.io/jsr/v/@lessjs/core?label=@lessjs/core)](https://jsr.io/@lessjs/core)

## Current State

Project line: **v0.20.0 Ocean-Island Architecture**.

The current production rendering mode is **SSG + Declarative Shadow DOM**.
`renderDSD()` is designed so the same engine can later run at cache-expiry time
(ISR) or request time (SSR), but those modes are roadmap work, not shipped
framework guarantees.

Package publishing is currently staggered: `@lessjs/ui` carries the v0.20.0
Ocean-Island work, `@lessjs/hub` is on the v0.19 line, and several core
packages still carry earlier package versions until the next coordinated
publish pass.

## Three Product Pillars

```text
LessJS
|
+-- 1. Application framework
|   +-- file-convention routes
|   +-- Hono API routes
|   +-- Vite dev server and SSG build
|   +-- serverless-oriented deployment model
|
+-- 2. DSD/WC rendering engine
|   +-- DsdElement, renderDSD(), StyleSheet
|   +-- Declarative Shadow DOM output
|   +-- Lit / React / Vanilla adapters
|   +-- compatibility admission and dsd-report.json
|
+-- 3. Registry Hub
    +-- package discovery
    +-- compatibility reports and snapshots
    +-- validation-gated less add workflow
```

## What Is Shipped

- **DSD-first rendering** - HTML contains `<template shadowrootmode="open">`
  output for SSR-capable components.
- **DsdElement** - a zero-dependency `HTMLElement` base for DSD-native Web
  Components.
- **SSR-safe StyleSheet** - a browser/CSSOM-compatible stylesheet abstraction
  that works during Deno/Node builds.
- **Ocean-Island UI model** - most UI components render as DSD-native ocean
  components; framework-heavy behavior remains in islands.
- **Hono API routes** - basic API routes work through the app route tree.
- **Registry evidence pipeline** - Hub records, package validation, snapshots,
  and `less add` exist as early-access infrastructure.
- **Release gates** - formatting, linting, typechecking, tests, build, e2e,
  audit, Hub validation, and DSD report checks are part of the workflow.

## What Is Next

- **Hydration strategies** - user-facing `client:load`, `client:idle`,
  `client:visible`, and `client:only`.
- **ISR cache layer** - stale-while-revalidate HTML regeneration.
- **Request context** - consistent env, platform, and request data for API and
  future SSR paths.
- **Signals + DsdElement** - reactive DOM updates without turning DSD components
  into a framework runtime.
- **Hub growth** - more real Web Component packages and clearer compatibility
  badges.

## Quick Start

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app
deno task dev
deno task build
```

Requirements: Deno 2.7+ and a modern browser with Declarative Shadow DOM
support.

## Packages

| Package                   | Role                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `@lessjs/core`            | DSD renderer, DsdElement, StyleSheet, renderer protocol, CEM parser, compatibility classifier |
| `@lessjs/adapter-vite`    | Vite orchestration, route scanning, SSG pipeline, island entry generation                     |
| `@lessjs/adapter-lit`     | Lit adapter, retained mainly for island and compatibility paths                               |
| `@lessjs/adapter-react`   | React adapter                                                                                 |
| `@lessjs/adapter-vanilla` | Vanilla Web Component adapter                                                                 |
| `@lessjs/app`             | Unified `lessjs()` entry                                                                      |
| `@lessjs/content`         | Blog, nav, and sitemap build plugins                                                          |
| `@lessjs/i18n`            | Locale expansion and route helpers                                                            |
| `@lessjs/ui`              | DSD-native Web Components and island examples                                                 |
| `@lessjs/signals`         | Signals helpers and island effects                                                            |
| `@lessjs/rpc`             | Fetch-based RPC controller                                                                    |
| `@lessjs/hub`             | Registry Hub schema, indexer, scanner, validator, snapshots                                   |
| `@lessjs/create`          | Project scaffold CLI                                                                          |

## Rendering Pipeline

```text
route component
  -> renderDSD()
  -> <template shadowrootmode="open">
  -> browser parses DSD
  -> custom element upgrade
  -> hydrateEvents / island runtime only where needed
```

| Mode | State   | When rendering happens | Server requirement        |
| ---- | ------- | ---------------------- | ------------------------- |
| SSG  | shipped | build time             | none after build          |
| ISR  | next    | cache expiry           | edge/serverless function  |
| SSR  | later   | every request          | always-on request runtime |

## Compatibility Boundary

LessJS does not promise universal automatic SSR for arbitrary Web Components.
Every component should reach one deterministic outcome:

- SSR/SSG through a declared adapter or validated package contract
- client-only fallback when browser APIs are required
- rejection before build output when metadata is invalid or unsafe

## Roadmap

| Version | Target                                        | Status  |
| ------- | --------------------------------------------- | ------- |
| v0.15   | Renderer Kernel Protocol                      | Done    |
| v0.16   | WC Package Protocol                           | Done    |
| v0.17   | Ecosystem Entry + SSR Boundary                | Done    |
| v0.18   | Universal WC Engine                           | Done    |
| v0.19   | Registry Hub + Component Browser              | Done    |
| v0.20   | Ocean-Island Architecture + DSD-native UI     | Current |
| v0.21   | Hydration Strategies + ISR + API Route parity | Next    |
| v0.22   | DsdElement + Signals rendering                | Planned |
| v1.0    | Stable Engine contracts                       | Vision  |

See [ADR docs](docs/adr/), [SOP docs](docs/sop/), and
[Roadmap](docs/roadmap/ROADMAP.md) for the governing documents.

## Governance Docs

```text
docs/
+-- adr/        architecture decision records
+-- changelog/  version changelogs
+-- sop/        standard operating procedures
+-- status/     project status and review archive
+-- roadmap/    version planning
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
