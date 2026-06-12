# @openelement/elements

First-class Elements authoring surface for openElement.

This package exposes `OpenElement`, the product-facing base class for native Web
Components built on openElement's existing shadow/DSD implementation. Shadow/DSD
is the default render mode; light DOM remains explicit opt-in.

`DsdElement` remains available as a v0.40 compatibility export from
`@openelement/core` and `@openelement/elements`, but new Elements docs and
starters should use `OpenElement`.

## Install

```bash
deno add jsr:@openelement/elements
```

## Usage

```tsx
import { OpenElement } from '@openelement/elements';
import type { VNode } from '@openelement/elements';

class MyCard extends OpenElement {
  render(): VNode {
    return (
      <article>
        <slot />
      </article>
    );
  }
}
```

## Boundary

`@openelement/elements` does not own routing, Vite, Nitro, UI components,
database, auth, cache, or the default signal engine. Those remain Framework,
UI, Protocols, or adapter concerns.

## License

MIT
