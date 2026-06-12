# openElement

English | [Simplified Chinese](./README.zh.md)

**JSX-first Web Components platform. Package line: `0.39.0` (`v0.39.0`
release). Active execution: `v0.39.0` Framework RC + Four-Product Matrix
Reset.**

openElement builds static-first applications with Web Components, JSX/VNode
rendering, progressive islands, API routes, and Vite + Nitro output. Shadow/DSD
is the default component render mode; light DOM is explicit opt-in.

Mandatory project workflow:
[`docs/governance/PROJECT_WORKFLOW.md`](./docs/governance/PROJECT_WORKFLOW.md).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-@openelement/core-blue)](https://jsr.io/@openelement/core)
[![CI](https://github.com/open-element/openelement/actions/workflows/autoflow-ci.yml/badge.svg)](https://github.com/open-element/openelement/actions/workflows/autoflow-ci.yml)

## Quick Start

```bash
deno run -A jsr:@openelement/create my-app
cd my-app
deno task dev
```

## Product Matrix

```text
openElement = Elements + UI + Framework + Protocols
```

| Product   | Surface                                       | Role                                                                    |
| --------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| Elements  | future `@openelement/elements`, `OpenElement` | Native Web Components authoring layer, competing with Lit and FAST.     |
| UI        | `@openelement/ui`                             | First-party `open-*` components built on the Elements model.            |
| Framework | `@openelement/app`, `@openelement/create`     | Pages, layouts, islands, API routes, Vite + Nitro build/runtime output. |
| Protocols | `@openelement/protocols`                      | Runtime-free replacement boundaries and conformance contracts.          |

Supporting packages such as `@openelement/runtime`, `@openelement/core`,
adapters, `signals`, `style-sheet`, `ssg`, `router`, `content`, and `i18n` are
advanced or implementation surfaces. They support the four products; they are
not separate first-class product lines.

In v0.40 planning, `OpenElement` is exposed from `@openelement/core` as the
product-facing Elements base class while the future `@openelement/elements`
package remains an ADR-governed package graph change.

## Why openElement

openElement renders Web Components on the server through Declarative Shadow DOM
where that mode is selected. Static content ships as HTML first. Interactive
pieces are islands that upgrade only when their hydration strategy says they
should.

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

## Current Line

All 20 workspace packages are aligned at **0.39.0** (`v0.39.0`) under
[`@openelement`](https://jsr.io/@openelement). The active execution line is
**v0.39.0**. ADR-0100 restores JSR publish as a release exit gate for v0.39+
closure.

v0.39.0 validates the generated Framework RC surface and records ADR-0099's
four-product matrix reset. It also keeps Web Awesome out of the current UI
target. ADR-0101 freezes broad heavy-framework island expansion and hands the
pre-1.0 proof to a bounded v0.40 Preact island priority.

The v1.0 target is a stable four-product platform with frozen Elements, UI,
Framework, and Protocols contracts.

## Documentation

| Section       | Link                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Guide         | [openelement.org/guide/getting-started](https://openelement.org/guide/getting-started)         |
| API Reference | [openelement.org/apilist](https://openelement.org/apilist)                                     |
| Architecture  | [openelement.org/architecture/architecture](https://openelement.org/architecture/architecture) |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Current truth lives in
[docs/status/STATUS.md](./docs/status/STATUS.md),
[docs/roadmap/ROADMAP.md](./docs/roadmap/ROADMAP.md), and
[docs/current/VERSION_PLAN.md](./docs/current/VERSION_PLAN.md). Architecture
decisions live in [docs/adr/](./docs/adr/), and historical SOP/NextVersion
packages remain release evidence until archived by the v0.40 cleanup.

## License

MIT
