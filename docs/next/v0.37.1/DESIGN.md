# v0.37.1 Design

## Rendering Modes

`DsdElement.renderMode` has two values:

- `shadow`: default. SSR emits Declarative Shadow DOM. CSR creates or reuses a
  shadow root.
- `light`: explicit opt-in. SSR emits host light DOM. CSR renders into the host
  element and does not attach a shadow root.

## Boundaries

- `renderDsd({ lightDom })` remains the host child preservation path for slot
  projection.
- island `dsd: false` remains an island rendering/admission setting.
- `hydrate: "only"` remains a client-only hydration strategy.
- `pure-island` remains a client-owned island layer.

## Style Rule

Light mode does not adopt `static styles` into a shadow root. Components using
light mode should rely on global CSS, inline rendered styles, or later UI CSS
contracts.
