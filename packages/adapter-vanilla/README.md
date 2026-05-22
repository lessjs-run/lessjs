# @lessjs/adapter-vanilla

Vanilla Web Component SSR adapter for [LessJS](https://github.com/lessjs-run/lessjs).

## Overview

SSR adapter for plain/vanilla Web Components whose `render()` returns a
string directly - no template framework like Lit or React required.

Provides:

- **installVanillaAdapter()** - registers `'vanilla'` adapter for DSD rendering
- **extractVanillaStyles()** - extracts static styles from vanilla components
- **DsdVanillaElement** - base class with DSD detection + hydration event binding

## Installation

```bash
npx jsr add @lessjs/adapter-vanilla
```

## Usage

### Install the adapter

```ts
import { installVanillaAdapter } from '@lessjs/adapter-vanilla';
installVanillaAdapter();
```

### Create a DSD-compatible component

```ts
import { DsdVanillaElement } from '@lessjs/adapter-vanilla';

class MyToggle extends DsdVanillaElement {
  static hydrateEvents = [
    { selector: 'button.toggle', event: 'click', method: '_handleToggle' },
  ];

  override render(): string {
    if (this._dsdHydrated) return '';
    return '<button class="toggle">Toggle</button>';
  }

  _handleToggle() {
    console.log('toggled');
  }
}

customElements.define('my-toggle', MyToggle);
```

## API

### `installVanillaAdapter()`

Registers the `'vanilla'` adapter with `@lessjs/core`'s render pipeline.
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
