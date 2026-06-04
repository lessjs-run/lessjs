# @openelement/ui

LessJS Web Components package.

The components are authored as native `DsdElement` custom elements and designed
to work with LessJS Declarative Shadow DOM output and island upgrade.

## Install

```bash
deno add jsr:@openelement/ui
```

## Components

| Component         | Tag                 | Notes                          |
| ----------------- | ------------------- | ------------------------------ |
| `LessButton`      | `less-button`       | Button component.              |
| `LessInput`       | `less-input`        | Input component.               |
| `LessCard`        | `less-card`         | Content card.                  |
| `LessCodeBlock`   | `less-code-block`   | Code block with copy behavior. |
| `LessLayout`      | `less-layout`       | Docs/layout shell.             |
| `LessThemeToggle` | `less-theme-toggle` | Theme switch island.           |
| `LessHeroPing`    | `less-hero-ping`    | Status indicator.              |
| `LessDialog`      | `less-dialog`       | Dialog component.              |
| `LessCallout`     | `less-callout`      | Callout/notice box.            |
| `LessStepCard`    | `less-step-card`    | Step card.                     |

## Package Manifest

`@openelement/ui` exports a CEM-compatible `manifest` so LessJS can include these
components in package manifest scanning:

```ts
import { lessjs } from '@openelement/app';

export default {
  plugins: [
    lessjs({
      packageIslands: ['@openelement/ui'],
    }),
  ],
};
```

The manifest includes attributes, events, slots, CSS parts, SSR renderability,
DSD behavior, and hydration strategy metadata.

## Subpath Exports

```text
@openelement/ui/less-button
@openelement/ui/less-input
@openelement/ui/less-card
@openelement/ui/less-code-block
@openelement/ui/less-layout
@openelement/ui/less-step-card
@openelement/ui/less-callout
@openelement/ui/less-theme-toggle
@openelement/ui/less-hero-ping
@openelement/ui/less-dialog
@openelement/ui/less-callout
@openelement/ui/less-step-card
@openelement/ui/open-props-tokens
```

## License

MIT
