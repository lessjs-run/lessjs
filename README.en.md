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

Project line: **v0.22.x Architecture Integrity**.

The current production rendering mode is **SSG + Declarative Shadow DOM** with
explicit island hydration strategies, route-level ISR metadata, and Reactive DSD
for small DSD-native Web Component interactions. `renderDSD()` remains the
rendering kernel; v0.21 adds safe `html` templates, Signal-driven `DsdElement`
updates, and streaming DSD without turning LessJS into a generic request-time
SSR server.

Packages are on the v0.22 line. `@lessjs/create` may advance by patch version
when generated-project smoke fixes need a new JSR release.

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
- **Hydration strategies** - `client:load`, `client:idle`, `client:visible`,
  and `client:only` are the only public island strategies.
- **Reactive DSD** - `DsdElement` can render native `html` templates and update
  from Signal-like values for small interactive components.
- **Safe templates** - template interpolation escapes by default, with
  `unsafeHTML()` as the explicit trust boundary.
- **Streaming DSD** - `renderDSDStream()` emits Response-compatible Web Stream
  chunks for future edge handlers.
- **ISR metadata** - routes can expose `revalidate`, producing ISR manifest
  evidence and using core cache primitives for adapter implementations.
- **API route parity** - API modules can export a Hono app or a
  `LessApiContext` with `request`, `params`, `env`, and `platform` (type-only).
- **Registry evidence pipeline** - Hub records, package validation, snapshots,
  and `less add` exist as early-access infrastructure.
- **Release gates** - formatting, linting, typechecking, tests, build, e2e,
  audit, Hub validation, and DSD report checks are part of the workflow.

## What Is Next

- **Architecture Integrity** - consumer import cleanup, package boundary repair,
  adapter-vite decomposition, and stronger quality gates.
- **Signals facade** - keep a LessJS-owned API while isolating the underlying
  signal engine.
- **Validation ownership** - unify Hub, CEM, manifest, and submission gate
  diagnostics.
- **Layered Package Architecture** - protocols/contracts ownership, core
  runtime boundary, runtime/app facade split, package graph gates, and docs
  governance.
- **Edge Full-Stack after cleanup** - ISR handler, KV adapters, and deployment
  guides resume after architecture layering exits.
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
| `@lessjs/compat-check`    | SSR compatibility classifier (standalone)                                                     |
| `@lessjs/cem`             | Custom Elements Manifest parser (standalone)                                                  |
| `@lessjs/style-sheet`     | Cross-environment CSSStyleSheet abstraction (standalone)                                      |
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
  -> @click binding / island runtime only where needed
```

| Mode | State   | When rendering happens | Server requirement        |
| ---- | ------- | ---------------------- | ------------------------- |
| SSG  | shipped | build time             | none after build          |
| ISR  | v0.24+  | cache expiry           | edge/serverless function  |
| SSR  | later   | every request          | always-on request runtime |

## Compatibility Boundary

LessJS does not promise universal automatic SSR for arbitrary Web Components.
Every component should reach one deterministic outcome:

- SSR/SSG through a declared adapter or validated package contract
- client-only fallback when browser APIs are required
- rejection before build output when metadata is invalid or unsafe

## Roadmap

| Version | Target                                    | Status  |
| ------- | ----------------------------------------- | ------- |
| v0.15   | Renderer Kernel Protocol                  | Done    |
| v0.16   | WC Package Protocol                       | Done    |
| v0.17   | Ecosystem Entry + SSR Boundary            | Done    |
| v0.18   | Universal WC Engine                       | Done    |
| v0.19   | Registry Hub + Component Browser          | Done    |
| v0.20   | Ocean-Island Architecture + DSD-native UI | Shipped |
| v0.21   | Reactive DSD + streaming                  | Done    |
| v0.22   | Architecture Integrity + cleanup gates    | Current |
| v0.23   | Layered Package Architecture              | Planned |
| v0.24   | Edge Full-Stack ISR + KV + Showcase       | Planned |
| v0.25   | Ecosystem Hardening                       | Planned |
| v1.0    | Stable Engine contracts                   | Vision  |

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
