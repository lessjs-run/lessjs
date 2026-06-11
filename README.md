# openElement

English | [简体中文](./README.zh.md)

**JSX-first, DSD-first Web Components application framework (v0.37.4 package
line current).**
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

export default definePage({
  route: { path: '/' },
  head: { title: 'Home' },
  render() {
    return <main>Hello openElement</main>;
  },
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

The current application contract (v0.33.0+ API foundation, current through
v0.37.4 Hygiene + CSS UI Foundation) is intentionally layered:

- application authoring: `definePage({ route, head, renderIntent, load, render, error })`, `defineIslandConfig()`, `defineIsland()`, `defineElement()`, `defineLayout()`;
- build configuration: `openElement()` from `@openelement/app/vite`;
- renderer model: JSX -> VNode -> RenderNode -> DSD HTML or DOM;
- island metadata field: `export const openElement = defineIslandConfig(...)`;
- UI naming line: `open-*`;
- trust boundary: `trustedHtml` for pre-sanitized, non-interactive content.
- app lifecycle: `load(ctx)`, route/meta context, `redirect()`, `notFound()`,
  and page `error(ctx)` fallback.

## Packages

All 20 workspace packages are currently aligned together at **v0.37.4** under
[`@openelement`](https://jsr.io/@openelement). The active release-truth target is
v0.37.4 JSR publish recovery; v0.37.5 protocol/UI work starts after release
closure.

| Package                     | Role                                      |
| --------------------------- | ----------------------------------------- |
| `@openelement/app`          | JSX-first application authoring API       |
| `@openelement/app/vite`     | `openElement()` Vite configuration facade |
| `@openelement/core`         | DSD renderer, DsdElement, JSX runtime     |
| `@openelement/adapter-vite` | Vite adapter and build orchestration      |
| `@openelement/ssg`          | SSG engine, route scanning, data resolver |
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

v0.37.4 is the current workspace package line. It delivers code-quality hygiene
(authoring.ts fix, logger unification, deprecated shell removal),
architecture decoupling (ui/router separation, dsd-hydration consolidation),
a Pure CSS UI Foundation (forked daisyUI class set as DSD-compatible
CSSStyleSheet with Open Props token engine, 3 interactive thin-shell
components), and test supplementation (ssg/router/protocols +113 tests).
JSR publish recovery remains open until all 20 packages are visible at
`0.37.4` and post-publish consumer smoke passes.

v0.36.5 closed release truth and AutoFlow drift without changing product APIs.
v0.37.0 resets product doctrine and rendering contracts before implementation
continues. The v0.37.x train then validates the four product surfaces in
bounded steps: elements, CSS-first UI, protocol ports, and the full-stack
framework/create preset.

Static routes should emit zero framework JavaScript unless islands, hydration,
or client-only components are explicit. SSR and ISR remain framework core
capabilities, DSD/shadow DOM is the default component mode, and light DOM is an
explicit future opt-in contract.

The v1.0 target is a Stable Four-Product Platform with workflow evidence as
part of the default release gate. AutoFlow remains execution and evidence
tooling; ADR and human review still govern API, package, release, and publish
decisions.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Architecture decisions live in
[docs/adr/](./docs/adr/), release execution lives in [docs/sop/](./docs/sop/),
active execution packages live in [docs/next/](./docs/next/), and current status
lives in [docs/status/STATUS.md](./docs/status/STATUS.md).

## License

MIT
