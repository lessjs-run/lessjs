# LessJS

English | [简体中文](./README.zh.md)

**DSD-first Web Components application framework** — LessJS combines a
standards-first DSD rendering engine, progressive islands, Hono API routes, and
an early Registry Hub, making Web Components first-class citizens.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-published-blue)](https://jsr.io/@lessjs/core)
[![@lessjs/core](https://img.shields.io/badge/jsr-v0.25.0-blue?label=@lessjs/core)](https://jsr.io/@lessjs/core)

## Ocean-Island Architecture

```
┌──────────────────────────────────────────┐
│              Ocean (~80%)                 │
│   DSD components → SSR rendered          │
│   → browser-native parsing, zero JS      │
│   → DsdElement: bind events, never DOM   │
│   → framework-agnostic, pure HTMLElement  │
│                                            │
│   ┌──────────────────────────────────┐    │
│   │         Islands (~20%)           │    │
│   │  Pure Island → client rendered   │    │
│   │  → needs reactivity              │    │
│   │  → pick by need: Lit/React/...   │    │
│   │  → strategies: load/idle/visible │    │
│   └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

**Core idea**: the ocean doesn't need reactivity (DOM is already rendered in SSR), islands do.
Other frameworks have "bare HTML" oceans. LessJS has "encapsulated Web Components" oceans.

## Current State

Project line: **v0.25.0 Declarative DX** — `lessPipeline()` entry, route types, SSG DSD restored, `less()` removed, 14 SOPs delivered.

### v0.25.0 Key Changes

- **`lessPipeline()` declarative API** — single build entry replacing scripted 3-phase build
- **Route type generation** — `.less/routes.d.ts` auto-generated from `[param]` patterns
- **`static head` / `static client`** — type declarations on DsdElement
- **`less()` removed** — zero backward compat, `lessPipeline()` is the only entry
- **SSG DSD restored** — tagName detection fixed (regex source scan), smoke test always rebuilds
- **SignalContext** (P2 conditional) — DOM-tree-based `createContext`/`provideContext`/`consumeContext`
- **CSS token convergence** — 20→2 `openPropsTokenSheet` imports
- **`as any` hardening** — 21→0 in core/src
- **`_dsdHydrated` removed** — unified `_renderOrHydrate()` path
- **API naming**: `defineIsland()`, `bindEvents()`, `renderDsd()`, `renderToDom()`, `getSsrProps()`

### Roadmap

| Version | Theme                                                                  | Status     |
| ------- | ---------------------------------------------------------------------- | ---------- |
| v0.25.0 | Declarative DX (14 SOPs: pipeline, types, guards, cleanup, fixup)      | ✅ Current |
| v0.26.0 | Reactive Pragmatic + Decoupling (`params`, `keep-alive`, zero virtual) | 📋 Planned |

See [ROADMAP.md](docs/roadmap/ROADMAP.md) for details.

### Note

> As of v0.25.0, JSX + `static props` + Signal is the only supported component model.
> `render()` returns `string | VNode`. TemplateResult no longer exists.
>
> Previous v0.21 (Reactive DSD) and v0.22 (Architecture Integrity) lines are complete. See [CHANGELOG.md](./CHANGELOG.md).

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
|   +-- DsdElement, renderDsd(), JSX runtime
|   +-- Declarative Shadow DOM output
|   +-- Lit / React / Vanilla adapters
|   +-- compatibility admission and dsd-report.json
|
+-- 3. Registry Hub
    +-- package discovery
    +-- compatibility reports and snapshots
    +-- validation-gated `less add` workflow
```

## What Is Shipped

- **DSD-first rendering** — SSR-capable components output `<template shadowrootmode="open">`.
- **DsdElement** — zero-dependency `HTMLElement` base for DSD-native Web Components.
- **SSR-safe StyleSheet** — cross-environment stylesheet abstraction for Deno/Node builds.
- **Ocean-Island UI model** — most UI is DSD-native ocean; complex interactions stay in islands.
- **Hydration strategies** — `client:load/idle/visible/only`.
- **Hono API routes** — basic API routes integrated into the app route tree.
- **Registry evidence pipeline** — Hub records, package validation, snapshots, `less add`.
- **Release gates** — fmt, lint, typecheck, test, build, dsd-report, graph, docs-staleness.

## What Is Next

- **Declarative build pipeline** — v0.25.0: three-phase hardcoded → declarative BuildPipeline API
- **Type-safe route parameters** — v0.25.0: build-time route type generation
- **Edge Full-Stack** — ISR handler, KV adapters, deployment guides
- **Hub growth** — more real WC packages and clearer compatibility badges

## Quick Start

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app
deno task dev
deno task build
```

Requirements: Deno 2.7+ and a modern browser with Declarative Shadow DOM support.

## Packages

| Package                   | Role                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `@lessjs/core`            | DSD renderer, DsdElement, JSX runtime, islands, navigation, logger, error boundary |
| `@lessjs/adapter-vite`    | Vite orchestration, route scanning, SSG pipeline, island entry generation          |
| `@lessjs/adapter-lit`     | Lit adapter, retained mainly for island and compatibility paths                    |
| `@lessjs/adapter-react`   | React adapter                                                                      |
| `@lessjs/adapter-vanilla` | Vanilla Web Component adapter                                                      |
| `@lessjs/app`             | Unified entry `lessjs()`                                                           |
| `@lessjs/content`         | Blog, nav, and sitemap build plugins                                               |
| `@lessjs/i18n`            | Locale expansion and route helpers                                                 |
| `@lessjs/ui`              | DSD-native Web Components and island examples                                      |
| `@lessjs/signals`         | Signal facade over `alien-signals`                                                 |
| `@lessjs/compat-check`    | SSR compatibility classifier (standalone)                                          |
| `@lessjs/cem`             | Custom Elements Manifest parser (standalone)                                       |
| `@lessjs/style-sheet`     | Cross-environment CSSStyleSheet abstraction (standalone)                           |
| `@lessjs/rpc`             | Fetch-based RPC controller                                                         |
| `@lessjs/hub`             | Registry Hub schema, indexer, scanner, validator, snapshots                        |
| `@lessjs/create`          | Project scaffold CLI                                                               |

## Rendering Pipeline

```text
route component
  -> renderDsd()
  -> <template shadowrootmode="open">
  -> browser parses DSD
  -> custom element upgrade
  -> @click binding / island runtime only where needed
```

| Mode | State   | When          | Server requirement |
| ---- | ------- | ------------- | ------------------ |
| SSG  | shipped | build time    | none after build   |
| ISR  | v0.24+  | cache expiry  | edge/serverless    |
| SSR  | later   | every request | always-on runtime  |

## Compatibility Boundary

LessJS does not promise universal automatic SSR for arbitrary Web Components.
Every component should reach one deterministic outcome:

- SSR/SSG through a declared adapter or validated package contract
- client-only fallback when browser APIs are required
- rejection before build output when metadata is invalid or unsafe

## Roadmap

| Version     | Target                                                        | Status      |
| ----------- | ------------------------------------------------------------- | ----------- |
| v0.15-v0.22 | Renderer Kernel → Architecture Integrity                      | Done        |
| v0.23       | Layered Package Architecture                                  | Done        |
| v0.24       | Consolidation — JSX+Signal, TemplateResult removal, hardening | Done        |
| v0.25       | Declarative DX — 14 SOPs: pipeline, types, guards, cleanup    | **Current** |
| v1.0        | Stable Engine contracts                                       | Vision      |

See [ADR docs](docs/adr/), [SOP docs](docs/sop/), and
[Roadmap](docs/roadmap/ROADMAP.md).

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
