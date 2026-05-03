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

KISS is currently alpha software. The direction is stable; the APIs are still being hardened.

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

| Package               | Role                                                     | Current line    |
| --------------------- | -------------------------------------------------------- | --------------- |
| `@kissjs/core`        | Vite plugin, route scanning, DSD rendering, SSG pipeline | `0.5.0-alpha.4` |
| `@kissjs/ui`          | Lit-based Web Component library and package islands      | `0.4.5`         |
| `@kissjs/rpc`         | Small fetch/RPC controller utilities                     | `0.2.4`         |
| `@kissjs/adapter-lit` | Optional Lit SSR adapter                                 | `0.1.4`         |
| `@kissjs/create`      | Project scaffolding CLI                                  | `0.3.2`         |

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
import { css, html, LitElement } from '@kissjs/core';

export const tagName = 'home-page';

export default class HomePage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 2rem;
    }
  `;

  render() {
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

## Build Pipeline

KISS uses a three-phase static build:

```bash
deno task build        # Phase 1: SSR bundle + build metadata
deno task build:client # Phase 2: island client chunks
deno task build:ssg    # Phase 3: static HTML + post-processing
```

For the full repository:

```bash
deno task build:all
deno task test
deno task lint
```

The repository is Deno-first. Vite is executed through `deno run -A npm:vite`; Node/npm/npx are
not part of the main workflow.

## Status

KISS is currently preparing the `v0.5.0-alpha.4` line.

Stable enough to evaluate:

- DSD-first static rendering
- package islands
- SSG output
- Hono API routes
- Deno-first local and CI workflows

Still being hardened:

- safe Lit SSR interpolation
- nested island path handling
- scaffold validation
- ISR/serverless conventions
- future `.kiss` compiler direction

## Documentation

- Docs site: [kiss.js.org](https://kiss.js.org/)
- Roadmap: [docs/app/routes/roadmap.ts](./docs/app/routes/roadmap.ts)
- Architecture decisions: [docs/decisions](./docs/decisions)

## License

MIT
