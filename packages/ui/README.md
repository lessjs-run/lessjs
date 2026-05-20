# @lessjs/ui

LessJS Web Components package.

**Current**: authored with Lit + DsdLitElement.
**Target (v0.20)**: migrate to native `DsdElement` — zero Lit dependency for DSD components, Lit retained only for Pure Islands (e.g., `less-hero-ping`).

All components leverage Declarative Shadow DOM for zero-JS-first rendering and island upgrade for interactive behavior.

## CSS Stack (v0.20 target)

```
@property               — typed CSS custom properties (Houdini)
CSS Custom Properties   — design token system
CSSStyleSheet           — adoptedStyleSheets (shared across instances)
CSS Parts ::part()      — external customization API
:state() pseudo-class   — custom element state
```

## Install

```bash
deno add jsr:@lessjs/ui
```

## Components

| Component         | Tag                 | Type        | Notes                                |
| ----------------- | ------------------- | ----------- | ------------------------------------ |
| `LessButton`      | `less-button`       | DSD (Ocean) | Button component.                    |
| `LessInput`       | `less-input`        | DSD (Ocean) | Input component.                     |
| `LessCard`        | `less-card`         | DSD (Ocean) | Content card.                        |
| `LessCodeBlock`   | `less-code-block`   | DSD (Ocean) | Code block with copy behavior.       |
| `LessLayout`      | `less-layout`       | DSD (Ocean) | Docs/layout shell.                   |
| `LessStepCard`    | `less-step-card`    | DSD (Ocean) | Step card component.                 |
| `LessCallout`     | `less-callout`      | DSD (Ocean) | Callout/admonition.                  |
| `LessThemeToggle` | `less-theme-toggle` | DSD (Ocean) | Theme switch island.                 |
| `LessDialog`      | `less-dialog`       | DSD (Ocean) | Dialog component.                    |
| `LessHeroPing`    | `less-hero-ping`    | Pure Island | Status indicator (needs reactivity). |

**Ocean / Island classification**:

- **DSD (Ocean)**: SSR renders full Shadow DOM. Client only binds events. Zero framework reactivity needed.
- **Pure Island**: Client-rendered. Needs framework reactivity (Lit / FAST / Preact).

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
@lessjs/ui/less-step-card
@lessjs/ui/less-callout
@lessjs/ui/less-theme-toggle
@lessjs/ui/less-hero-ping
@lessjs/ui/less-dialog
@lessjs/ui/design-tokens
```

## License

MIT
