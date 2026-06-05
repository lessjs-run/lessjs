# openElement

English | [简体中文](./README.zh.md)

**JSX-first, DSD-first Web Components application framework (v0.32.0).**
openElement builds static-first applications with Declarative Shadow DOM,
JSX/VNode rendering, progressive islands, Hono routes, and release gates that
prove the package graph before publishing.

Mandatory project workflow:
[`docs/governance/PROJECT_WORKFLOW.md`](./docs/governance/PROJECT_WORKFLOW.md).

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
import { definePage } from '@openelement/app';

export default definePage(() => {
  return <main>Hello openElement</main>;
});
```

For browser-upgraded UI:

```tsx
import { defineIsland } from '@openelement/app';
import { signal } from '@openelement/runtime';

const count = signal(0);

export default defineIsland(
  'my-counter',
  () => <button onClick={() => count.value++}>Count: {count.value}</button>,
);
```

The v0.32.0 public contract is intentionally layered:

- application authoring: `definePage()`, `defineIsland()`, `defineElement()`, `defineLayout()`;
- build configuration: `openElement()` from `@openelement/app/vite`;
- renderer model: JSX -> VNode -> RenderNode -> DSD HTML or DOM;
- metadata field: `openElement`;
- UI naming line: `open-*`;
- trust boundary: `trustedHtml` for pre-sanitized, non-interactive content.
- app lifecycle: `load(ctx)`, route/meta context, `redirect()`, `notFound()`,
  and page `error(ctx)` fallback.

## Packages

All 19 packages are versioned together at **v0.32.0** under
[`@openelement`](https://jsr.io/@openelement).

| Package                     | Role                                      |
| --------------------------- | ----------------------------------------- |
| `@openelement/app`          | JSX-first application authoring API       |
| `@openelement/app/vite`     | `openElement()` Vite configuration facade |
| `@openelement/core`         | DSD renderer, DsdElement, JSX runtime     |
| `@openelement/adapter-vite` | Vite adapter, SSG pipeline, island builds |
| `@openelement/runtime`      | runtime convenience facade                |
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

v0.32.0 makes the application lifecycle explicit on top of the v0.31
JSX-first authoring model. `DsdElement` remains the runtime primitive, but app
authors start from `@openelement/app`.

The next minors focus on rendering runtime/deployment, server routes, data
integration, UI Shell product surfaces, hardening, package surface reset, and
release-candidate validation without reopening the cleaned v0.30 renderer
contract. The v1.0 target is a stable application engine after this
v0.31-v0.39 line is implementation-proven.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Architecture decisions live in
[docs/adr/](./docs/adr/), release execution lives in [docs/sop/](./docs/sop/),
active execution packages live in [docs/next/](./docs/next/), and current status
lives in [docs/status/STATUS.md](./docs/status/STATUS.md).

## License

MIT
