# KISS

[English](./README.md) | [简体中文](./README.zh-CN.md)

KISS is a Deno-first, Web Standards-first fullstack framework for static-first applications.

It combines Declarative Shadow DOM, Web Components, Island Upgrade, SSG, Hono serverless APIs,
and Vite into a small framework surface. The goal is not to hide the platform, but to make the
platform productive.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/SisyphusZheng/kiss/actions/workflows/test.yml/badge.svg)](https://github.com/SisyphusZheng/kiss/actions/workflows/test.yml)
[![@kissjs/core](https://img.shields.io/jsr/v/@kissjs/core?logo=jsr&labelColor=0a0a0a)](https://jsr.io/@kissjs/core)
[![@kissjs/ui](https://img.shields.io/jsr/v/@kissjs/ui?logo=jsr&labelColor=083344)](https://jsr.io/@kissjs/ui)
[![@kissjs/rpc](https://img.shields.io/jsr/v/@kissjs/rpc?logo=jsr&labelColor=083344)](https://jsr.io/@kissjs/rpc)
[![@kissjs/create](https://img.shields.io/jsr/v/@kissjs/create?logo=jsr&labelColor=083344)](https://jsr.io/@kissjs/create)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF)](https://vite.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002)](https://hono.dev/)
[![Lit](https://img.shields.io/badge/Lit-optional-325CFF)](https://lit.dev/)

## Why KISS

Modern frontend stacks often make HTML a runtime artifact. KISS starts from the opposite
direction:

- render semantic HTML at build time
- preserve component boundaries with Declarative Shadow DOM
- upgrade only the interactive islands that need JavaScript
- use native Web APIs before framework abstractions
- keep serverless APIs close to the route tree
- publish and run through Deno-first workflows

KISS 0.5 is the trust release for the static-first DSD + Island Upgrade path.

## Quick Start

```bash
deno run -A jsr:@kissjs/create my-app
cd my-app
deno task dev
```

Requirements:

- Deno 2.7 or newer
- A modern browser with Declarative Shadow DOM support

## Architecture

KISS means more than "small code". It is a set of constraints:

| Letter | Constraint | Meaning                                                                                    |
| ------ | ---------- | ------------------------------------------------------------------------------------------ |
| K      | Knowledge  | Build-time knowledge is preferred over runtime discovery.                                  |
| I      | Isolated   | Client JavaScript should live inside islands and component boundaries.                     |
| S      | Semantic   | HTML remains the primary document format and accessibility substrate.                      |
| S      | Static     | SSG output should be deployable as static files, with serverless APIs as an optional edge. |

The current rendering model is:

```text
Route module
  -> Web Component render()
  -> Declarative Shadow DOM HTML
  -> static HTML file
  -> optional island client chunk
  -> Custom Element upgrade in the browser
```

This is intentionally different from a full client hydration model. KISS does not try to
reconstruct an application tree on the client. It upgrades Custom Elements where interaction is
needed.

## Packages

| Package               | Role                                                     | Current line |
| --------------------- | -------------------------------------------------------- | ------------ |
| `@kissjs/core`        | Vite plugin, route scanning, DSD rendering, SSG pipeline | `0.5.2`      |
| `@kissjs/ui`          | Lit-based Web Component library and package islands      | `0.5.0`      |
| `@kissjs/rpc`         | Small fetch/RPC controller utilities                     | `0.3.0`      |
| `@kissjs/adapter-lit` | Optional Lit SSR adapter                                 | `0.2.0`      |
| `@kissjs/create`      | Project scaffolding CLI                                  | `0.4.4`      |

Deprecated historical packages such as `@kissjs/vite` and `@kissjs/ssg` should not be used.

## Project Shape

```text
my-app/
  app/
    routes/
      index.ts
      about.ts
      api/
        status.ts
    islands/
      counter.ts
    components/
      shell.ts
  deno.json
  vite.config.ts
```

Pages are file-based routes. API files export Hono apps. Islands are client chunks that register
Custom Elements.

## Example Route

```ts
import { css, html, LitElement } from 'lit';

export const tagName = 'home-page';

export default class HomePage extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 2rem;
    }
  `;

  override render() {
    return html`
      <main>
        <h1>Hello from KISS</h1>
        <counter-island></counter-island>
      </main>
    `;
  }
}

customElements.define(tagName, HomePage);
```

## Build

KISS apps use one production build command:

```bash
deno task build
```

Internally, `@kissjs/core/cli/build` still keeps SSR bundling, island client chunks, and SSG
rendering as separate observable phases. The split is for debugging and CI, not for the main user
workflow.

For the full repository:

```bash
deno task build:all
deno task test
deno task lint
```

The repository is Deno-first. Vite is executed through `deno run -A npm:vite`; Node/npm/npx are
not part of the main workflow.

## Status

KISS is on the `v0.5.0` trust release line.

Stable enough to evaluate:

- DSD-first static rendering
- package islands
- SSG output
- Hono API routes
- Deno-first local and CI workflows

Planned for later releases:

- DSD Renderer 2: nested DSD, slot/projection, safe template helpers
- ISR/serverless conventions
- future `.kiss` compiler direction

## Documentation

- Docs site: [kiss.js.org](https://kiss.js.org/)
- Roadmap: [docs/app/routes/roadmap.ts](./docs/app/routes/roadmap.ts)
- Architecture decisions: [docs/decisions](./docs/decisions)

## License

MIT
