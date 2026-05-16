# @lessjs/adapter-react

React SSR adapter for [LessJS](https://github.com/lessjs-run/lessjs).

## Overview

SSR adapter for React components used as Web Components in the LessJS
framework. Uses `ReactDOMServer.renderToStaticMarkup()` for clean DSD
HTML output without React hydration markers.

Provides:

- **installReactAdapter()** — registers `'react'` adapter for DSD rendering
- **isReactElement()** — detects React elements via `$$typeof` symbol
- **renderReactToString()** — converts React elements to HTML strings
- **DsdReactElement** — base class wrapping React components as Web Components

## Installation

```bash
npx jsr add @lessjs/adapter-react
```

## Usage

### Install the adapter

```ts
import { installReactAdapter } from '@lessjs/adapter-react';
installReactAdapter();
```

### Create a React-wrapped Web Component

```ts
import { DsdReactElement } from '@lessjs/adapter-react';
import { createElement } from 'react';

function Greeting({ name }: { name: string }) {
  return createElement('div', null, `Hello ${name}`);
}

class GreetingElement extends DsdReactElement {
  static observedAttributes = ['name'];

  getReactElement() {
    return createElement(Greeting, { name: this.getAttribute('name') || 'World' });
  }
}

customElements.define('greeting-element', GreetingElement);
```

## Why renderToStaticMarkup()?

`renderToString()` adds `data-reactroot` attributes for client hydration.
Since LessJS uses DSD (Declarative Shadow DOM) for SSR, we don't need
React's hydration markers — the browser handles DOM from the template.
`renderToStaticMarkup()` produces clean HTML without extra attributes.

## API

### `installReactAdapter()`

Registers the `'react'` adapter with `@lessjs/core`'s render pipeline.
Idempotent — safe to call multiple times.

### `uninstallReactAdapter()`

Removes the React adapter, reverting to core's default behavior.

### `isReactElement(value)`

Checks if a value is a React element by looking for the `$$typeof`
symbol (`Symbol.for('react.element')`).

### `renderReactToString(element, tagName?)`

Renders a React element to an HTML string using
`ReactDOMServer.renderToStaticMarkup()`.

### `DsdReactElement`

Pre-composed base class extending `HTMLElement` with DSD hydration support
for React components. Implements `getReactElement()` for SSR rendering and
client-side mounting.

## Peer Dependencies

- `react@^19`
- `react-dom@^19`

## License

MIT
