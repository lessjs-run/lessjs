# ADR-0071: Same Input, Same Semantics, Backend Renderers

| Metadata   | Value                                                           |
| ---------- | --------------------------------------------------------------- |
| ADR        | 0071                                                            |
| Status     | Accepted                                                        |
| Date       | 2026-05-31                                                      |
| Version    | v0.28.0                                                         |
| Supersedes | The `renderNestedCustomElements` / parse5 post-processing model |
| Related    | ADR-0062, ADR-0065, ADR-0070, SOP-011                           |

## Context

LessJS now has a single component authoring model:

```ts
class Page extends DsdElement {
  render() {
    return <main>Hello</main>;
  }
}
```

That `render()` result is a VNode tree. The tree is the framework input.

The broken historical model was not the existence of SSR and CSR as separate
outputs. That separation is correct. The broken model was that SSR threw away
the tree too early:

1. `renderToString(VNode)` serialized the tree into an HTML string.
2. `__wrapAppShell()` inserted app-shell HTML by string concatenation.
3. `renderNestedCustomElements()` parsed the string again with parse5.
4. The second pass tried to recover custom element structure from the rebuilt
   HTML tree.

This produced the v0.28 app-shell bugs: missing layout DSD, fragile search
output, theme isolation, and false cycle warnings.

## Decision

LessJS uses this rendering architecture:

```text
Component.render()
  -> VNode tree
      -> SSR backend: renderNestedDsd()
      -> CSR backend: renderToDom()
```

The rule is:

**Same input, same semantics, different output backend.**

SSR and CSR do not share one renderer because they produce different artifacts:

- SSR produces an HTML string with DSD templates and event markers.
- CSR produces live DOM nodes, event listeners, refs, and signal effects.

They must share:

- the same VNode input shape
- the same prop naming rules
- the same signal unwrapping rules
- the same control-flow semantics for `Fragment`, `Show`, and `For`
- the same custom element composition semantics

They must not share:

- string serialization internals
- DOM mutation internals
- event binding mechanics

## Target Model

```text
VNode tree
  node kind:
    text/signal       -> unwrap and escape
    Fragment/Show/For -> recurse
    function/class    -> render and recurse
    HTML element      -> serialize attrs, recurse children
    registered CE     -> renderDsd(tag, props), then insert rendered light DOM children
```

For a root app shell, adapter-vite constructs a real VNode tree:

```ts
jsx('less-layout', {
  currentPath: routePath,
  locale,
  locales,
  navItems,
  headerNav,
  children: [jsx(pageTag, pageProps)],
});
```

`renderNestedDsd()` owns the final SSR traversal. The output shape is:

```html
<less-layout current-path="/guide">
  <template shadowrootmode="open">
    <slot></slot>
  </template>
  <page-guide>
    <template shadowrootmode="open">
      <main>...</main>
    </template>
  </page-guide>
</less-layout>
```

The page component is light DOM for `less-layout`; the browser projects it into
`<slot>`. No adapter-level `replace("</less-layout>", ...)` is allowed.

## Module Boundaries

### `@lessjs/core`

Owns rendering semantics:

- VNode and JSX runtime
- SSR backend: `renderNestedDsd`
- CSR backend: `renderToDom`
- host wrapper: `renderDsd`
- DSD/CSR host lifecycle: `DsdElement`
- event marker serialization and hydration

### `@lessjs/adapter-vite`

Owns build orchestration:

- route scanning
- SSR entry generation
- generated data resolution
- SSG route execution
- root VNode assembly

It must not own HTML composition semantics.

### `@lessjs/ui`

Owns framework UI components such as `less-layout`, `less-search`, and
`less-theme-toggle`. These components are normal custom elements and must enter
the same rendering path as user components.

### `@lessjs/router`

Owns CSR navigation only. It does not define SSR route structure.

### `@lessjs/content` and `@lessjs/i18n`

Own build-time generated data. They write disk-backed generated modules, which
adapter-vite resolves through `@lessjs/generated/*`.

## Accepted Changes

1. `renderNestedDsd()` must preserve light DOM children for registered custom
   elements.
2. adapter-vite must construct a root VNode for app-shell rendering.
3. `_renderer.ts` renderers become VNode tree wrappers, not HTML string wrappers.
4. `renderNestedCustomElements`, parse5, and app-shell HTML replacement remain
   deleted.
5. `renderToString()` remains a basic synchronous HTML backend for simple VNode
   serialization, but SSG app-shell rendering must use `renderNestedDsd()`.

## Rejected Models

### One renderer for SSR and CSR

Rejected. SSR and CSR have different outputs. Forcing one renderer would add a
new intermediate layer or reintroduce string-to-DOM parsing.

### String app shell with rendered layout DSD

Rejected. Rendering `less-layout` through `renderDsd()` and then inserting page
HTML with string replacement is better than the old bypass, but it still keeps
HTML composition in adapter-vite.

### parse5 post-processing

Rejected. VNode is already the tree. Re-parsing HTML creates a second tree and
breaks ownership of semantics.

## Consequences

Positive:

- app shell and route pages use one VNode tree
- custom element shadow DOM and light DOM are both represented by core
- nested DSD no longer needs parse5
- the SSR/CSR split is explicit and maintainable

Trade-offs:

- `_renderer.ts` becomes a VNode wrapper API, which is a breaking change from
  HTML string wrappers
- route render diagnostics now need to be collected at the tree backend level
  instead of from a single `renderDsdByName(pageTag)` call

The trade-off is accepted because LessJS v0.28 is already removing workaround
chains and does not preserve old app-shell behavior.
