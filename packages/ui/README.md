# @lessjs/ui

LessJS Web Components package.

The components are authored as native `DsdElement` custom elements and designed
to work with LessJS Declarative Shadow DOM output and island upgrade.

## Install

```bash
deno add jsr:@lessjs/ui
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

`@lessjs/ui` exports a CEM-compatible `manifest` so LessJS can include these
components in package manifest scanning:

```ts
import { lessjs } from '@lessjs/app';

export default {
  plugins: [
    lessjs({
      packageIslands: ['@lessjs/ui'],
    }),
  ],
};
```

The manifest includes attributes, events, slots, CSS parts, SSR renderability,
DSD behavior, and hydration strategy metadata.

## Subpath Exports

```text
@lessjs/ui/less-button
@lessjs/ui/less-input
@lessjs/ui/less-card
@lessjs/ui/less-code-block
@lessjs/ui/less-layout
@lessjs/ui/less-step-card
@lessjs/ui/less-callout
@lessjs/ui/less-theme-toggle
@lessjs/ui/less-hero-ping
@lessjs/ui/less-dialog
@lessjs/ui/less-callout
@lessjs/ui/less-step-card
@lessjs/ui/open-props-tokens
```

## License

MIT
