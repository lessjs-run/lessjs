# @lessjs/core

Pure LessJS runtime package.

`@lessjs/core` owns the platform-facing runtime primitives:

- **DSD rendering** — `renderDSD()`, `renderDSDByName()`
- **DsdElement** — zero-framework base class for DSD components
- **Island metadata** — island detection, strategy, hydration
- **Navigation** — SPA helpers
- **SSR context** — per-request context, escaping, structured errors
- **Renderer Protocol** — adapter registry, error classification

It does not contain Vite, CLI, or build orchestration logic.

## Install

```bash
deno add jsr:@lessjs/core
```

## Main Exports

```ts
import {
  // Utilities
  camelToKebab,
  // SSR context
  createSsrContext,
  // DsdElement base class
  DsdElement,
  escapeAttr,
  escapeAttrValue,
  escapeHtml,
  extractParams,
  // Adapters
  getAdapter,
  getSSRProps,
  // Islands
  island,
  lessBind,
  // Errors
  LessError,
  parseQuery,
  registerAdapter,
  // DSD rendering
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
  RendererProtocol,
  SafeHtml,
  UnsafeHtml,
} from '@lessjs/core';
```

## Ocean-Island Rendering Model

```text
Ocean (DSD Components):
  DsdElement.render(): string
    → renderDSD()
    → <template shadowrootmode="open">
    → browser native Shadow DOM parsing (zero JS)
    → DsdElement.hydrateEvents()
    → interactive ✅

Island (Pure Island):
  LitElement.render() / FASTElement.template / Preact h()
    → Adapter
    → renderDSD()
    → empty custom element shell
    → client framework upgrade
    → interactive ✅
```

**Key insight**: Ocean components don't need framework reactivity — DOM is
already complete from SSR. Only Islands (client-rendered) need a reactive
framework.

`renderDSD()` is framework-agnostic. Adapter support (Lit, React, etc.) is
installed through per-framework adapter packages that register a
`RendererProtocol`.

## DsdElement

```ts
import { DsdElement, type HydrateEventDescriptor } from '@lessjs/core';

class MyComponent extends DsdElement {
  static hydrateEvents: HydrateEventDescriptor[] = [
    { selector: 'button', event: 'click', method: '_handleClick' },
  ];

  // SSR contract: return Shadow DOM HTML string
  render(): string {
    return `<button class="btn" part="control">
      <slot></slot>
    </button>`;
  }

  _handleClick() {/* ... */}
}
```

Zero framework dependency. No Lit, no `html`, no `css` tagged template.
`render()` returns a plain string — the native contract for DSD SSR.

## Current Protocol Boundary

`PackageIslandMeta` is intentionally small today:

```ts
interface PackageIslandMeta {
  tagName: string;
  modulePath: string;
  strategy?: 'load' | 'idle' | 'visible' | 'only';
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
@lessjs/core/dsd-element
```

## License

MIT
