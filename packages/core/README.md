# @lessjs/core

Pure LessJS runtime package.

`@lessjs/core` owns the platform-facing runtime primitives: Declarative Shadow
DOM rendering, island metadata types, navigation helpers, SSR context, escaping,
structured errors, and the render adapter registry. It does not contain Vite,
CLI, or build orchestration logic.

## Install

```bash
deno add jsr:@lessjs/core
```

## Main Exports

```ts
import {
  camelToKebab,
  createSsrContext,
  escapeAttr,
  escapeAttrValue,
  escapeHtml,
  extractParams,
  getAdapter,
  getSSRProps,
  island,
  lessBind,
  LessError,
  parseQuery,
  registerAdapter,
  renderDSD,
  renderDSDByName,
  renderSsrError,
  SsrRenderError,
  wrapInDocument,
} from '@lessjs/core';

import type {
  ComponentLayer,
  DsdOptions,
  FrameworkOptions,
  HydrateEventDescriptor,
  PackageIslandMeta,
  RenderAdapter,
  SafeHtml,
  UnsafeHtml,
} from '@lessjs/core';
```

## Rendering Model

```text
component render()
  -> string or adapter-supported template
  -> renderDSD()
  -> nested custom elements
  -> <template shadowrootmode="open">
  -> browser custom element upgrade
```

`renderDSD()` is framework-agnostic. Lit support is installed through
`@lessjs/adapter-lit`, which registers a `RenderAdapter`.

## Current Protocol Boundary

`PackageIslandMeta` is intentionally small today:

```ts
interface PackageIslandMeta {
  tagName: string;
  modulePath: string;
  strategy?: 'eager' | 'lazy' | 'idle' | 'visible';
}
```

This supports package island scanning and client upgrade. It is not yet a full
registry protocol. The roadmap expands this into a Custom Elements
Manifest-compatible package manifest with fields for SSR renderability, DSD
constraints, hydration, diagnostics, events, parts, states, slots, and tokens.

Until that protocol exists, LessJS should not promise automatic SSR or hydration
for arbitrary Web Components.

## Subpath Exports

```text
@lessjs/core
@lessjs/core/errors
@lessjs/core/context
@lessjs/core/logger
@lessjs/core/navigation
@lessjs/core/constants
```

## License

MIT
