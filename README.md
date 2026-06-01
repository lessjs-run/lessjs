# LessJS

English | [简体中文](./README.zh.md)

**The DSD-first Web Components framework.** Build static sites with real Shadow DOM, zero JS overhead, and progressive islands.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-@lessjs/core-blue)](https://jsr.io/@lessjs/core)
[![CI](https://github.com/lessjs-run/lessjs/actions/workflows/test.yml/badge.svg)](https://github.com/lessjs-run/lessjs/actions/workflows/test.yml)

## Quick Start

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app && deno task dev
```

## Why LessJS

LessJS renders Web Components on the server via **Declarative Shadow DOM**. The browser parses DSD natively — no hydration, no JS for static content. Interactive pieces are **islands**: small, strategy-gated components that load on demand.

```tsx
// routes/index/index.tsx
import { DsdElement } from '@lessjs/runtime';

export default class HomePage extends DsdElement {
  render() {
    return <h1>Hello LessJS</h1>;
  }
}
```

The App Shell (`<less-layout>`) is applied automatically by the Builder — pages only declare their content.

## Features

- **DSD-first** — Server-rendered Shadow DOM. Zero JS overhead for static content.
- **JSX + Signals** — React-like DX with fine-grained reactivity via `alien-signals`.
- **File-based routing** — `app/routes/` maps 1:1 to URL paths.
- **SSG built-in** — Build-time rendering, sitemaps, PWA manifest. Deno-native.
- **Progressive islands** — `client:load | idle | visible | only` hydration strategies.
- **Hono API routes** — Drop API handlers into the route tree.
- **Zero-bundler dev** — `deno task dev:fast` cold starts in ~100ms.
- **Framework-agnostic** — Lit, React, and Vanilla adapters for islands.

## Documentation

| Section       | Link                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| Guide         | [lessjs.com/guide/getting-started](https://lessjs.com/guide/getting-started)         |
| API Reference | [lessjs.com/apilist](https://lessjs.com/apilist)                                     |
| Architecture  | [lessjs.com/architecture/architecture](https://lessjs.com/architecture/architecture) |

## Packages

| Package                | Version | Description                                                 |
| ---------------------- | ------- | ----------------------------------------------------------- |
| `@lessjs/core`         | v0.28.0 | DSD renderer, DsdElement, JSX runtime, islands, navigation  |
| `@lessjs/adapter-vite` | v0.28.0 | Vite plugin: route scanning, SSG pipeline, island entries   |
| `@lessjs/ui`           | v0.28.0 | DSD-native UI components (button, card, input, dialog...)   |
| `@lessjs/signals`      | v0.28.0 | Signal primitives (signal, computed, effect)                |
| `@lessjs/content`      | v0.28.0 | Blog, nav, sitemap build plugins                            |
| `@lessjs/i18n`         | v0.28.0 | Locales, route expansion                                    |
| `@lessjs/create`       | v0.28.0 | Project scaffold CLI                                        |
| `@lessjs/runtime`      | v0.28.0 | Unified component authoring facade (core + signals + style) |

[All 19 packages →](https://jsr.io/@lessjs)

## What's New in v0.28.0

- **Architecture contracts stabilized** — `createAdapterRegistry()` factory, `LessRenderer` interface expansion, `onRenderError` hook, try/catch around `_renderOrHydrate`.
- **Full Open Props migration** — 7 color scales (indigo/green/red/orange/blue/teal/cyan) with dark mode inversions; 0 custom semantic tokens, 0 hardcoded colors in www/.
- **CI composite action** — reusable workflow exported, 5-step matrix reduced from 14 to 9 jobs.
- **Documentation site theme gates** — 80+ test cases covering SSR/CSR theme parity, search/sidebar/TOC color isolation.
- **Signal-driven registry** — registry index rewritten to zero manual DOM via `data-signal` + `data-signal-attr`.
- **[Full changelog →](https://github.com/lessjs-run/lessjs/blob/dev/docs/changelog/v0.28.0.md)**

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Architecture decisions in [docs/adr/](./docs/adr/). Target: **v1.0** stable engine freeze.

## License

MIT
