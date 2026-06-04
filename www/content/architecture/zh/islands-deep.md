# Island Deep Dive

An island is a Custom Element that is discovered by the build and upgraded by a client entry only when needed.

## Layers

- `dsd-static`: no client JavaScript; SSG emits DSD.
- `dsd-interactive`: SSG emits DSD and VNode event markers; the client hydrates JSX handlers.
- `pure-island`: the browser owns rendering; use this for browser-only components.

## Strategies

- `load` imports immediately.
- `idle` imports during idle time.
- `visible` imports near the viewport.
- `only` skips SSR and lets the client render.

## Current Event Model

Interactive UI should be written as JSX:

```tsx
<button onClick={() => this.close()}>Close</button>;
```

The build/runtime serializes event markers and hydrates them from the VNode tree. Do not use method-name strings, `data-on-*`, or dynamic `innerHTML` for interactive UI.

## SSR Props

`bindSsrProps(element)` restores `data-ssr-props` onto the upgraded element. This is prop restoration, not event binding.
