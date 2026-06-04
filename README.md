# openElement

English | [简体中文](./README.zh.md)

**DSD-first Web Components framework (v0.30.1).** openElement builds static-first
applications with Declarative Shadow DOM, JSX/VNode rendering, progressive
islands, Hono routes, and release gates that prove the package graph before
publishing.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-@openelement/core-blue)](https://jsr.io/@openelement/core)
[![CI](https://github.com/open-element/openelement/actions/workflows/test.yml/badge.svg)](https://github.com/open-element/openelement/actions/workflows/test.yml)

## Quick Start

```bash
deno run -A jsr:@openelement/create my-app
cd my-app
deno task dev
```

## Why openElement

openElement renders Web Components on the server through Declarative Shadow DOM.
Static content ships as HTML first. Interactive pieces are islands that upgrade
only when their `client:*` strategy says they should.

```tsx
import { DsdElement, type VNode } from '@openelement/runtime';

export default class HomePage extends DsdElement {
  render(): VNode {
    return <main>Hello openElement</main>;
  }
}
```

The current v0.30.1 contract is intentionally narrow:

- one app facade: `openElement()`;
- one renderer model: JSX -> VNode -> RenderNode -> DSD HTML or DOM;
- one metadata field: `openElement`;
- one UI naming line: `open-*`;
- one trust boundary: `trustedHtml` for pre-sanitized, non-interactive content.

## Packages

All 19 packages are versioned together at **v0.30.1** under
[`@openelement`](https://jsr.io/@openelement).

| Package                     | Role                                      |
| --------------------------- | ----------------------------------------- |
| `@openelement/core`         | DSD renderer, DsdElement, JSX runtime     |
| `@openelement/adapter-vite` | Vite adapter, SSG pipeline, island builds |
| `@openelement/app`          | `openElement()` app configuration facade  |
| `@openelement/runtime`      | component authoring facade                |
| `@openelement/ui`           | `open-*` DSD component library            |
| `@openelement/content`      | Markdown, MDX, nav, blog, sitemap         |
| `@openelement/i18n`         | locale data and static path helpers       |
| `@openelement/hub`          | registry metadata and validation          |

## Documentation

| Section       | Link                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Guide         | [openelement.org/guide/getting-started](https://openelement.org/guide/getting-started)         |
| API Reference | [openelement.org/apilist](https://openelement.org/apilist)                                     |
| Architecture  | [openelement.org/architecture/architecture](https://openelement.org/architecture/architecture) |

## Current Line

v0.30.1 is the clean architecture sweep after the v0.30.0 contract freeze. It
removes active LessJS compatibility names, keeps dynamic UI on the VNode path,
and aligns current docs and package metadata with the openElement identity.

v0.31 is reserved for UI Shell/Ocean-Island work. **v1.0** remains the stable
engine target after the renderer, metadata, package graph, and trust-boundary
contracts have been proven in product-facing surfaces.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Architecture decisions live in
[docs/adr/](./docs/adr/), release execution lives in [docs/sop/](./docs/sop/),
and current status lives in [docs/status/STATUS.md](./docs/status/STATUS.md).

## License

MIT
