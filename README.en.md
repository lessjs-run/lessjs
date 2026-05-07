# LessJS

[简体中文](./README.md) | [English](./README.en.md)

LessJS is a Deno-first, Web Standards-first modern full-stack framework for static-first applications.

It combines Declarative Shadow DOM, Web Components, Island Upgrade, SSG, Hono serverless APIs,
and Vite into a minimal framework surface. LessJS aims not to hide the Web platform, but to make
the platform itself more usable.

LessJS evolved from the KISS framework (Keep It Simple, Stupid), continuing the same philosophy.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/lessjs-run/lessjs/actions/workflows/test.yml/badge.svg)](https://github.com/lessjs-run/lessjs/actions/workflows/test.yml)
[![@lessjs/core](https://img.shields.io/jsr/v/@lessjs/core?logo=jsr&labelColor=0a0a0a)](https://jsr.io/@lessjs/core)
[![@lessjs/ui](https://img.shields.io/jsr/v/@lessjs/ui?logo=jsr&labelColor=083344)](https://jsr.io/@lessjs/ui)
[![@lessjs/rpc](https://img.shields.io/jsr/v/@lessjs/rpc?logo=jsr&labelColor=083344)](https://jsr.io/@lessjs/rpc)
[![@lessjs/create](https://img.shields.io/jsr/v/@lessjs/create?logo=jsr&labelColor=083344)](https://jsr.io/@lessjs/create)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF)](https://vite.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002)](https://hono.dev/)
[![Lit](https://img.shields.io/badge/Lit-optional-325CFF)](https://lit.dev/)

## Why LessJS

Most modern frontend stacks treat HTML as a runtime artifact. LessJS takes the opposite approach,
starting from HTML and the Web platform itself:

- Render semantic HTML at build time
- Preserve component boundaries with Declarative Shadow DOM
- Only upgrade the interactive islands that truly need JavaScript
- Prefer native Web APIs over framework abstractions
- Keep serverless APIs close to the route tree
- Run, build, and publish through a Deno-first workflow

## Quick Start

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app
deno task dev
```

Requirements:

- Deno 2.7 or later
- A modern browser with Declarative Shadow DOM support

## Architecture

LessJS is not just about "less code." It is a set of architectural constraints:

| Letter | Constraint | Meaning                                                                                      |
| ------ | ---------- | -------------------------------------------------------------------------------------------- |
| K      | Knowledge  | Prefer build-time knowledge over runtime discovery.                                          |
| I      | Isolated   | Client JavaScript should stay within island and component boundaries.                        |
| S      | Semantic   | HTML remains the primary document format and the foundation of accessibility.                |
| S      | Static     | SSG output should be deployable as static files; serverless APIs are optional dynamic edges. |

Current rendering model:

```text
Route module
  -> Web Component render()
  -> Declarative Shadow DOM HTML
  -> static HTML file
  -> optional island client chunk
  -> Custom Element upgrade in the browser
```

This differs intentionally from a full client hydration model. LessJS does not attempt
to rebuild the application tree on the client — it upgrades Custom Elements at interaction
points.

Current version v0.6.0-alpha.1 is the DSD + Island Architecture + Web Standards release.

## Packages

| Package               | Responsibility                                           | Current Version |
| --------------------- | -------------------------------------------------------- | --------------- |
| `@lessjs/core`        | Vite plugin, route scanning, DSD rendering, SSG pipeline | 0.6.0-alpha.1   |
| `@lessjs/ui`          | Lit-based Web Component library and package islands      | 0.6.0           |
| `@lessjs/rpc`         | Lightweight fetch/RPC controller tools                   | 0.3.1           |
| `@lessjs/adapter-lit` | Optional Lit SSR adapter                                 | 0.3.0           |
| `@lessjs/create`      | Project scaffolding CLI                                  | 0.4.7           |
| `@lessjs/signal`      | Reactive signals system                                  | 0.6.0-alpha.1   |

Legacy packages `@lessjs/vite` and `@lessjs/ssg` are deprecated.

## Project Structure

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

Pages are file-routed. API files export Hono apps. Islands are client chunks that register
Custom Elements.

## Route Example

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
        <h1>Hello from LessJS</h1>
        <counter-island></counter-island>
      </main>
    `;
  }
}

customElements.define(tagName, HomePage);
```

## Build

Building a LessJS application for production takes a single command:

```bash
deno task build
```

Internally, three observable phases remain — SSR bundle, island client chunks, SSG rendering —
for debugging and CI diagnostics. These are no longer part of the user-facing quickstart path.

Full repository commands:

```bash
deno task build:all
deno task test
deno task lint
```

This repository is Deno-first. Vite runs via `deno run -A npm:vite`; Node/npm/npx is not
part of the primary workflow.

## Documentation

- Docs site: [lessjs.com](https://lessjs.com/)
- Roadmap: [docs/app/routes/roadmap.ts](./docs/app/routes/roadmap.ts)
- Architecture decisions: [docs/decisions](./docs/decisions)

## License

MIT
