# @lessjs/ui

LessJS Web Components package.

The components are authored with Lit and designed to work with LessJS
Declarative Shadow DOM output and island upgrade.

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

## Package Islands

`@lessjs/ui` exports an `islands` metadata array so LessJS can include these
components in package island scanning:

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

This metadata is a current bridge, not the final WC registry protocol. Future
manifests should add CEM-compatible fields for attributes, properties, events,
slots, CSS parts, tokens, SSR renderability, DSD behavior, hydration strategy,
and diagnostics.

## Subpath Exports

```text
@lessjs/ui/less-button
@lessjs/ui/less-input
@lessjs/ui/less-card
@lessjs/ui/less-code-block
@lessjs/ui/less-layout
@lessjs/ui/less-theme-toggle
@lessjs/ui/less-hero-ping
@lessjs/ui/less-dialog
@lessjs/ui/design-tokens
```

## License

MIT
