# LessJS

[简体中文](./README.md) | [English](./README.en.md)

LessJS is a Deno-first, Web Standards-first modern full-stack framework for static-first applications.

It combines Declarative Shadow DOM, Web Components, Island Upgrade, SSG, Hono serverless APIs,
and Vite into a minimal framework surface. LessJS aims not to hide the Web platform, but to make
the platform itself more usable.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF)](https://vite.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002)](https://hono.dev/)
[![Lit](https://img.shields.io/badge/Lit-optional-325CFF)](https://lit.dev/)
[![@lessjs/core](https://img.shields.io/jsr/v/@lessjs/core?label=@lessjs/core&style=flat-square)](https://jsr.io/@lessjs/core)
[![@lessjs/ui](https://img.shields.io/jsr/v/@lessjs/ui?label=@lessjs/ui&style=flat-square)](https://jsr.io/@lessjs/ui)
[![@lessjs/adapter-lit](https://img.shields.io/jsr/v/@lessjs/adapter-lit?label=@lessjs/adapter-lit&style=flat-square)](https://jsr.io/@lessjs/adapter-lit)
[![@lessjs/rpc](https://img.shields.io/jsr/v/@lessjs/rpc?label=@lessjs/rpc&style=flat-square)](https://jsr.io/@lessjs/rpc)
[![@lessjs/signal](https://img.shields.io/jsr/v/@lessjs/signal?label=@lessjs/signal&style=flat-square)](https://jsr.io/@lessjs/signal)
[![@lessjs/create](https://img.shields.io/jsr/v/@lessjs/create?label=@lessjs/create&style=flat-square)](https://jsr.io/@lessjs/create)

## Why LessJS

Most modern frontend stacks treat HTML as a runtime artifact. LessJS takes the opposite approach,
starting from HTML and the Web platform itself:

- Render semantic HTML at build time
- Preserve component boundaries with **Declarative Shadow DOM** (L2 recursive nesting)
- Only upgrade interactive **Islands** that truly need JavaScript
- Prefer native Web APIs (`<dialog>`, `:state()`, Navigation API) over framework abstractions
- Manage reactive state with **TC39 Signals** (native `Signal` fallback)
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

## Rendering Model

```text
Route module (Web Component / LitElement)
  → render() → TemplateResult
  → SSR adapter → Declarative Shadow DOM (L2 recursive nesting)
  → static HTML file + inline DSD templates
  → optional island client chunk (4 strategies: eager / lazy / visible / idle)
  → browser: native DSD attachment + Custom Element upgrade (DSD hydration, skip re-render)
```

LessJS does not do full client-side hydration tree reconciliation. Instead, it upgrades Custom Elements at interaction points on demand.

**DSD Hydration**: When the browser natively attaches Declarative Shadow DOM, Lit components
detect the existing shadow root and skip re-rendering, avoiding duplicate content (blank boxes,
double footers, etc.).

## v0.6 New Features

### Declarative Shadow DOM — Recursive Nesting

The v0.6 core breakthrough: **L2 Nested DSD**.

```html
<!-- Page-level DSD -->
<page-examples>
  <template shadowrootmode="open">
    <!-- less-layout's DSD -->
    <less-layout>
      <template shadowrootmode="open">
        <!-- less-button inside less-layout gets its own DSD too -->
        <less-button variant="primary">
          <template shadowrootmode="open">
            <style>
              /* button styles */
            </style>
            <button class="btn">Click me</button>
          </template>
        </less-button>
      </template>
    </less-layout>
  </template>
</page-examples>
```

Every nested Custom Element receives its own `<template shadowrootmode>` with complete CSS encapsulation.
Final styles are visible without any JavaScript.

### TC39 Signals — Reactive State

Forked from signal-polyfill, aligned with the browser-native `Signal` API:

```ts
import { computed, effect, signal } from '@lessjs/signal';

const count = signal(0);
const doubled = computed(() => count.value * 2);
effect(() => console.log(`count is now ${count.value}`));
count.value++; // → "count is now 1"
```

- `signal()` — reactive value
- `computed()` — auto-dependency-tracked derived value
- `effect()` — side-effect auto-re-execution
- `islandEffect()` — Island lifecycle binding

### Form-Associated Custom Elements

Native form integration without polyfills:

```html
<form onsubmit="console.log(new FormData(this))">
  <less-input name="email" label="Email" required></less-input>
  <less-input type="password" label="Password" required></less-input>
  <less-button type="submit" variant="primary">Submit</less-button>
</form>
```

- `less-button`: supports `type="submit"`, `:state(disabled)` CSS pseudo-class
- `less-input`: supports `:state(invalid)`, `:state(disabled)`
- Participates in native form submission via `ElementInternals.setFormValue()`

### Navigation API

Client-side routing built on WHATWG Navigation API:

```ts
import { matchRoute, navigate, onNavigate } from '@lessjs/core';

onNavigate((event) => {
  const route = matchRoute(event.destination.url);
  // handle navigation...
});
navigate('/about');
```

### less-dialog Component

Native `<dialog>` element wrapper:

```html
<less-dialog open>
  <p slot="header">Confirm Action</p>
  <p>Are you sure you want to proceed?</p>
  <less-button slot="footer" variant="primary">Yes</less-button>
</less-dialog>
```

- Native `<dialog>` + `::backdrop`
- `:state(open/closed)` CSS pseudo-classes
- `inert` accessibility attribute

### Speculative Loading

Resource hints injected based on island strategy:

- **eager**: `<link rel="modulepreload">` — preload and execute
- **lazy/visible/idle**: `<link rel="prefetch">` — fetch to cache only

## Packages

| Package               | Responsibility                                                              | Version |
| --------------------- | --------------------------------------------------------------------------- | ------- |
| `@lessjs/core`        | Vite plugin, route scanning, DSD rendering (L2 nested), Navigation API, SSG | 0.6.1   |
| `@lessjs/ui`          | Lit-based Web Component library (with DSD hydration)                        | 0.6.1   |
| `@lessjs/signal`      | TC39 Signals fork (signal/computed/effect/islandEffect)                     | 0.6.1   |
| `@lessjs/adapter-lit` | Optional Lit SSR adapter                                                    | 0.6.1   |
| `@lessjs/rpc`         | Lightweight fetch/RPC controller tools                                      | 0.6.1   |
| `@lessjs/create`      | Project scaffolding CLI                                                     | 0.6.1   |

Legacy packages `@lessjs/vite` and `@lessjs/ssg` are deprecated.

### @lessjs/ui Component Inventory

| Component           | Description                             | DSD | Form-Associated      | Island |
| ------------------- | --------------------------------------- | --- | -------------------- | ------ |
| `less-layout`       | App layout (header/sidebar/footer)      | ✅  | ❌                   | ❌     |
| `less-button`       | Button (default/primary/ghost)          | ✅  | ✅ (`type="submit"`) | ❌     |
| `less-card`         | Card container (optional header/footer) | ✅  | ❌                   | ❌     |
| `less-input`        | Input field (supports label/error)      | ✅  | ✅                   | ❌     |
| `less-code-block`   | Code block (with copy button)           | ✅  | ❌                   | ❌     |
| `less-dialog`       | Dialog (native dialog element)          | ✅  | ❌                   | ❌     |
| `less-theme-toggle` | Theme toggle (dark/light)               | ✅  | ❌                   | ✅     |
| `less-hero-ping`    | API status indicator                    | ✅  | ❌                   | ✅     |

All UI components implement **DSD hydration**: when the browser's native Declarative Shadow DOM
attachment is detected, Lit skips re-rendering, ensuring zero-difference between SSR output and
client activation.

## Project Structure

```text
my-app/
  app/
    routes/
      index.ts          # Pages = file routing
      about.ts
      api/
        status.ts       # Hono API route
    islands/
      counter.ts        # Islands = client-side interactive components
    components/
      shell.ts
  deno.json
  vite.config.ts
```

Pages are file-routed. API files export Hono apps. Islands are client chunks that register
Custom Elements. All page components output Declarative Shadow DOM.

## Route Example

```ts
import { css, html, LitElement } from 'lit';
import '@lessjs/ui/less-layout';

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
for debugging and CI diagnostics.

Full repository commands:

```bash
deno task build:ssg    # Build SSG only (static HTML)
deno task test         # Run tests
deno task lint         # Lint check
deno task fmt:check    # Format check
```

This repository is Deno-first. Vite runs via `deno run -A npm:vite`; Node/npm/npx is not
part of the primary workflow.

## Design System

LessJS UI components follow Swiss International Style:

- **Pure B&W color scheme** — managed via Open Props Design Tokens for light/dark themes
- **0.5px borders** — site-wide minimal border weight
- **4px spacing base** — spacing scale based on 4px unit
- **CSS custom properties cascade into Shadow DOM** — theme variables flow from `:root` to all components
- **Form-Associated CE** — form components natively participate in `<form>` submission

Theme variable example:

```css
/* Light theme */
--less-text-primary: var(--gray-12); /* black */
--less-bg-base: var(--gray-0); /* white */

/* Dark theme */
--less-text-primary: var(--gray-0); /* white */
--less-bg-base: var(--gray-12); /* black */
```

## Documentation

- Docs site: [lessjs.com](https://lessjs.com/)
- Changelog: [/changelog](https://lessjs.com/changelog)
- Roadmap: [/roadmap](https://lessjs.com/roadmap)
- Architecture decisions: [/decisions](https://lessjs.com/decisions)
- UI component showcase: [/ui](https://lessjs.com/ui)

## Version History

| Version           | Date       | Highlights                                                                                   |
| ----------------- | ---------- | -------------------------------------------------------------------------------------------- |
| **0.6.1**         | 2026-05-07 | v0.6 stable release — README cleanup, all packages version-aligned, CI stability fixes       |
| **0.6.0-alpha.1** | 2026-05-06 | DSD + Islands + Signals + Form-Associated CE + Navigation API + Dialog + Speculative Loading |
| **0.5.5**         | 2026-05-06 | Full brand rename (105 files)                                                                |
| **0.5.3**         | 2026-05-05 | Trust Release — docs promises align with build artifacts                                     |
| **0.5.0**         | 2026-05-04 | Single-command build + Core/Lit boundary tightening                                          |
| **0.4.0**         | 2026-04-30 | Serverless API + Blog system + PWA SW strategy rewrite                                       |
| **0.3.0**         | 2026-04-29 | Package Islands auto-detection + Theme Toggle Island                                         |
| **0.2.0**         | 2026-04-27 | Package Islands auto-detection                                                               |
| **0.1.7**         | 2026-04-27 | @lessjs/ui component library + dogfooding                                                    |
| **0.1.6**         | 2026-04-26 | Design system + mobile responsive                                                            |
| **0.1.5**         | 2026-04-20 | Architecture constraint definition                                                           |
| **0.1.4**         | 2026-04-15 | inject option + API Routes docs                                                              |
| **0.1.3**         | 2026-04-10 | @lessjs/rpc + @lessjs/ui                                                                     |
| **0.1.2**         | 2026-04-05 | Island AST transform                                                                         |
| **0.1.1**         | 2026-04-01 | Initial JSR release                                                                          |

## License

MIT
