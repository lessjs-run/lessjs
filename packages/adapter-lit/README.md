# @openelement/adapter-lit

Lit adapter for LessJS DSD rendering.

The adapter lets `@openelement/core` render Lit `TemplateResult` values into clean
Declarative Shadow DOM HTML. It does not use `@lit-labs/ssr` and does not emit
Lit marker comments in the final DSD output.

## Install

```bash
deno add jsr:@openelement/adapter-lit
```

## Usage

```ts
import { installLitAdapter } from '@openelement/adapter-lit';

installLitAdapter();
```

Call `installLitAdapter()` once in the SSR bundle entry path so `renderDSD()` can
handle Lit templates.

## DSD Interactive Components

```ts
import { DsdLitElement } from '@openelement/adapter-lit';
import { html } from 'lit';

class MyToggle extends DsdLitElement {
  static hydrateEvents = [
    { selector: 'button', event: 'click', method: 'toggle' },
  ];

  toggle() {
    this.toggleAttribute('active');
  }

  render() {
    return html`
      <button>Toggle</button>
    `;
  }
}
```

`DsdLitElement` reuses the shadow root created by Declarative Shadow DOM and
binds only declared events. It is not full-page hydration.

## Exports

```text
@openelement/adapter-lit
@openelement/adapter-lit/ssr
@openelement/adapter-lit/dsd-hydration
```

## Boundary

Lit is the current practical authoring adapter, not the definition of LessJS.
Future FAST or plain-string adapters should integrate through the same renderer
protocol once that protocol is stable.

## License

MIT
