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

| Package                | Version | Role                                         | External Deps       |
| ---------------------- | ------- | -------------------------------------------- | ------------------- |
| `@lessjs/core`         | 0.14.9  | DSD rendering, Islands, Navigation, Logger   | parse5 only         |
| `@lessjs/adapter-vite` | 0.14.9  | Vite build: routes, islands, SSG 3-phase     | vite, hono, esbuild |
| `@lessjs/adapter-lit`  | 0.14.9  | Lit TemplateResult → DSD HTML bridge         | lit                 |
| `@lessjs/content`      | 0.14.9  | Blog + Nav + Sitemap build-time plugin       | marked, gray-matter |
| `@lessjs/i18n`         | 0.14.9  | i18n locale expansion                        | none                |
| `@lessjs/app`          | 0.14.9  | Umbrella: lessjs() = less() + content + i18n | —                   |
| `@lessjs/ui`           | 0.14.9  | 8 Web Components (layout, button, input…)    | lit                 |
| `@lessjs/signals`      | 0.14.9  | TC39 Signals polyfill + framework layer      | none                |
| `@lessjs/rpc`          | 0.14.9  | Zero-dep fetch RPC controller                | none                |
| `@lessjs/create`       | 0.14.9  | CLI scaffold                                 | none                |

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

| ADR  | Decision                                                 |
| ---- | -------------------------------------------------------- |
| 0017 | Runtime/build separation (core vs adapter-vite)          |
| 0018 | Virtual data modules replace module state                |
| 0019 | @deno/vite-plugin replaces 20 resolve.alias entries      |
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

## 0.14.7 Release Hardening

- All packages are aligned on `0.14.7`, with `@lessjs/signals` as the current signals package name.
- `@lessjs/adapter-vite` exposes CLI subpaths so scaffolded apps can run `deno task build` directly.
- Publishing no longer allows dirty worktrees, and CI now uses the same quality tasks as local development.
- E2E uses an isolated port and runs in CI, preventing accidental reuse of stale local servers.
- Content, Markdown, `headExtras`, and `headFragments` trust developer-controlled repository content by default. Do not pass user-generated HTML directly; sanitize untrusted content first.

Stable API candidates: `lessjs()` options, public `@lessjs/core` exports, `@lessjs/adapter-vite` CLI subpaths, `@lessjs/rpc`, `@lessjs/signals`, and `@lessjs/ui` component subpaths.

---

## v0.14.5 — First-Round Code Review Fixes (2026-05-15)

Fixed 12 issues (5 blockers + 5 suggestions + 2 nits):

**Blockers**: effect() pending window signal loss, CSP nonce validation, dialog inert compat, DSD rendering graceful degradation, observer memory leak
**Suggestions**: batch() deprecation, islandEffect polling opt, renderDSD adapter reuse, SSR history guard, regex escaping
**Nits**: JSON.parse opt, UI registration docs

See [CHANGELOG-v0.14.5](deliverables/review260515/CHANGELOG-v0.14.5.md)

---

## v0.14.9 — Second-Round Deep Review Fixes (2026-05-15)

Fixed 16 issues (3 blockers + 9 suggestions + 3 nits + 1 pre-existing bug):

**Blockers**: case-sensitive renderer matching, SSG 404 dir residual, allNoExternal duplicate paths
**Suggestions**: tree-shaking docs, adapter-registry warning, polyfill swap+pop guard, dynamic import JSR warning, c.req.param() defensive, i18n static route skip (with pre-existing bugfix), CE tag exclude comments, monorepo path fallback, Map O(1) lookup
**Nits**: configResolved clarification, fs/promises async I/O, polyfill symbols to module scope

Bonus: fixed a pre-existing i18n bug where `getStaticPaths()` returned `[]` for static routes, causing locale pages to be silently skipped.

See [CHANGELOG-v0.14.9](deliverables/review260515/CHANGELOG-v0.14.9.md)

---

## License

MIT
