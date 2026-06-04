# @openelement/ui

openElement Web Components package.

The components are authored as native `DsdElement` custom elements and designed
to work with openElement Declarative Shadow DOM output and island upgrade.

## Install

```bash
deno add jsr:@openelement/ui
```

## Components

| Component         | Tag                 | Notes                          |
| ----------------- | ------------------- | ------------------------------ |
| `OpenButton`      | `open-button`       | Button component.              |
| `OpenInput`       | `open-input`        | Input component.               |
| `OpenCard`        | `open-card`         | Content card.                  |
| `OpenCodeBlock`   | `open-code-block`   | Code block with copy behavior. |
| `OpenLayout`      | `open-layout`       | Docs/layout shell.             |
| `OpenThemeToggle` | `open-theme-toggle` | Theme switch island.           |
| `OpenHeroPing`    | `open-hero-ping`    | Status indicator.              |
| `OpenDialog`      | `open-dialog`       | Dialog component.              |
| `OpenCallout`     | `open-callout`      | Callout/notice box.            |
| `OpenStepCard`    | `open-step-card`    | Step card.                     |

## Package Manifest

`@openelement/ui` exports a CEM-compatible `manifest` so openElement can include these
components in package manifest scanning:

```ts
import { openElement } from '@openelement/app';

export default {
  plugins: [
    openElement({
      packageIslands: ['@openelement/ui'],
    }),
  ],
};
```

The manifest includes attributes, events, slots, CSS parts, SSR renderability,
DSD behavior, and hydration strategy metadata.

## Subpath Exports

```text
@openelement/ui/open-button
@openelement/ui/open-input
@openelement/ui/open-card
@openelement/ui/open-code-block
@openelement/ui/open-layout
@openelement/ui/open-step-card
@openelement/ui/open-callout
@openelement/ui/open-theme-toggle
@openelement/ui/open-hero-ping
@openelement/ui/open-dialog
@openelement/ui/open-callout
@openelement/ui/open-step-card
@openelement/ui/open-props-tokens
```

## License

MIT
