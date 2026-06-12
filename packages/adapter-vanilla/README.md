# @openelement/adapter-vanilla

Vanilla Web Component SSR adapter for [openElement](https://github.com/open-element/openelement).

> v0.39 surface: advanced adapter ecosystem. First-run apps should use
> `@openelement/app` and `@openelement/runtime` before direct adapter imports.

## Overview

SSR adapter for plain/vanilla Web Components whose `render()` returns a
string directly - no template framework like Lit or React required.

Provides:

- **installVanillaAdapter()** - registers `'vanilla'` adapter for DSD rendering
- **extractVanillaStyles()** - extracts static styles from vanilla components
- **DsdVanillaElement** - base class with DSD detection + hydration event binding

## Installation

```bash
npx jsr add @openelement/adapter-vanilla
```

## Usage

### Install the adapter

```ts
import { installVanillaAdapter } from '@openelement/adapter-vanilla';
installVanillaAdapter();
```

### Create a DSD-compatible component

```tsx
import { DsdVanillaElement } from '@openelement/adapter-vanilla';
import type { VNode } from '@openelement/core';

class MyToggle extends DsdVanillaElement {
  static hydrateEvents = [
    { selector: 'button.toggle', event: 'click', method: '_handleToggle' },
  ];

  override render(): VNode | null {
    if (this._dsdHydrated) return null;
    return <button class='toggle'>Toggle</button>;
  }

  _handleToggle() {
    console.log('toggled');
  }
}

customElements.define('my-toggle', MyToggle);
```

## API

### `installVanillaAdapter()`

Registers the `'vanilla'` adapter with `@openelement/core`'s render pipeline.
Idempotent - safe to call multiple times.

### `uninstallVanillaAdapter()`

Removes the vanilla adapter, reverting to core's default behavior.

### `extractVanillaStyles(componentClass)`

Extracts static `styles` property from a vanilla component class.
Supports `string` and `string[]` formats.

### `DsdVanillaElement`

Pre-composed base class extending `HTMLElement` with DSD hydration support.
Provides `_dsdHydrated` flag, automatic event binding from `static hydrateEvents`,
and cleanup via `AbortController`.

## License

MIT
