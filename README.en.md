# LessJS

[简体中文](./README.md) | [English](./README.en.md)

A Deno-first static site framework built on **Declarative Shadow DOM + Island Architecture**.
HTML exists before JavaScript — not as a runtime artifact.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-published-blue)](https://jsr.io/@lessjs/core)
[![@lessjs/core](https://img.shields.io/jsr/v/@lessjs/core?label=core&style=flat-square)](https://jsr.io/@lessjs/core)
[![@lessjs/ui](https://img.shields.io/jsr/v/@lessjs/ui?label=ui&style=flat-square)](https://jsr.io/@lessjs/ui)

---

## Architecture

```
                   ┌── @lessjs/app (umbrella entry)
                   │
         ┌─────────┼─────────┐
         ▼         ▼         ▼
   adapter-vite   content    i18n
   (build)        (content)  (i18n)
         │
         ▼
    @lessjs/core (pure runtime)
         │
    ┌────┼────┬────┬────┐
    │    │    │    │    │
  adapter-lit  ui  signals  rpc  create
  (Lit)  (components)  (reactive)  (RPC)  (scaffold)
```

### Package Overview

| Package | Version | Role | External Deps |
|---------|---------|------|--------------|
| `@lessjs/core` | 0.13.0 | DSD rendering, Islands, Navigation, Logger | parse5 only |
| `@lessjs/adapter-vite` | 0.3.0 | Vite build: routes, islands, SSG 3-phase | vite, hono, esbuild |
| `@lessjs/adapter-lit` | 0.8.0 | Lit TemplateResult → DSD HTML bridge | lit |
| `@lessjs/content` | 0.3.3 | Blog + Nav + Sitemap build-time plugin | marked, gray-matter |
| `@lessjs/i18n` | 0.1.1 | i18n locale expansion | none |
| `@lessjs/app` | 0.3.1 | Umbrella: lessjs() = less() + content + i18n | — |
| `@lessjs/ui` | 0.7.1 | 8 Web Components (layout, button, input…) | lit |
| `@lessjs/signals` | 0.6.2 | TC39 Signals polyfill + framework layer | none |
| `@lessjs/rpc` | 0.6.1 | Zero-dep fetch RPC controller | none |
| `@lessjs/create` | 0.7.0 | CLI scaffold | none |

### Rendering Pipeline

```
Route module (Web Component / LitElement)
  → render() → string / TemplateResult
  → renderDSD() → L2 nested DSD HTML (parse5 AST recursive)
  → SSG output: static HTML + inline DSD templates
  → Browser: native DSD attachment → Custom Element upgrade
  → DSD Hydration: skip re-render, bind events only
  → Island chunk lazy loading (4 strategies)
```

**DSD Hydration**: After the browser natively parses `<template shadowrootmode>`, Lit components detect existing shadow roots and skip `render()`. Components that need event bindings use the `WithDsdHydration` Mixin with declarative `hydrateEvents`.

### SSG Build (3-Phase)

```
Phase 1: less() Vite plugin
  → Route scanning + Island scanning
  → Generate virtual:less-hono-entry (Hono app code)
  → closeBundle() triggers Phase 2/3

Phase 2: buildClient()
  → Generate virtual:less-client-entry
  → viteBuild() islands → dist/client/islands/*.js

Phase 3: buildSSG()
  → Generate virtual:less-ssg-entry
  → viteBuild(ssr:true, noExternal) → SSR bundle
  → Load bundle → Hono toSSG() → static HTML
  → Post-processing: client script, View Transitions, Speculation Rules,
    CSP, DSD polyfill, PWA
```

---

## Quick Start

```bash
# Scaffold
deno run -A jsr:@lessjs/create my-app
cd my-app

# Dev
deno task dev

# Build (SSG 3-phase)
deno task build
```

Requirements:
- Deno 2.7+
- Modern browser with Declarative Shadow DOM support

---

## Architecture Decisions (ADRs)

All ADRs are in the [blog](/blog/) — search `type: adr` to filter. Key decisions:

| ADR | Decision |
|-----|----------|
| 0017 | Runtime/build separation (core vs adapter-vite) |
| 0018 | Virtual data modules replace module state |
| 0019 | @deno/vite-plugin replaces 20 resolve.alias entries |
| 0021 | API surface convergence + Phase tokens + core-Vite split |

---

## v0.12 → v0.13 Changes

- **Core API surface**: 18 exports → 6. Internal subpaths (`./render-dsd`, `./html-escape`) removed
- **ssr-handler.ts deleted**: Pure re-export facade, consumers use `@lessjs/core`
- **Core-Vite split**: Virtual module IDs moved to `@lessjs/adapter-vite/virtual-ids`
- **Phase compile-time checks**: Branded types `Phase1Token`/`Phase2Token`/`Phase3Token`
- **CI coverage**: All test jobs now collect `--coverage`
- **Zero barrel files**: `content/src/nav/types.ts` and `sitemap/types.ts` deleted
- **islandEffect interval**: 5000ms → 30000ms
- **@lessjs/app tests**: 0 → 16 tests

---

## License

MIT
