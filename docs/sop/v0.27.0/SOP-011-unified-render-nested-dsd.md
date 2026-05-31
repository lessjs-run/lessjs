# SOP-011: Unified Render Backends

> Version: v0.28.0\
> Status: Implemented target model\
> Date: 2026-05-31\
> ADR: ADR-0071\
> Principle: same input, same semantics, different output backend

## Goal

Finish the ADR-0071 rendering model:

```text
Component.render()
  -> VNode tree
      -> SSR backend: renderNestedDsd()
      -> CSR backend: renderToDom()
```

The implementation must remove app-shell HTML replacement from adapter-vite and
make core responsible for custom element light DOM composition.

## Non-Goals

- Do not create one renderer that tries to serve both SSR and CSR.
- Do not reintroduce parse5 or HTML post-processing.
- Do not add a new IR layer between VNode and the backend renderers.
- Do not make `www` hand-write routing, event binding, or CSS workarounds.

## Architecture Contract

### Input

The only rendering input is a VNode tree.

Examples:

```ts
jsx('div', { children: ['text'] });
jsx('page-guide', { slug: 'intro' });
jsx('less-layout', { children: [jsx('page-guide', {})] });
```

### SSR Backend

`renderNestedDsd(node)` walks the tree once and returns HTML:

- text and numbers become escaped text
- signals are unwrapped
- `Fragment`, `Show`, and `For` recurse
- normal HTML tags serialize attributes and recurse children
- registered custom elements call `renderDsd(tag, Cls, props)`
- custom element children are rendered as light DOM and inserted before the
  closing host tag

### CSR Backend

`renderToDom(node)` walks the same tree and returns DOM:

- event handlers become listeners
- refs are invoked
- signal props create DOM effects
- no SSR markers are generated

### Host

`DsdElement` is the browser host:

- with existing DSD shadow root: hydrate markers and signals
- without DSD shadow root: render the VNode through `renderToDom`

## Implementation Steps

### 1. Core: custom element light DOM

File:

- `packages/core/src/jsx-render-string.ts`

Required behavior:

```ts
await renderNestedDsd(
  jsx('test-shell', {
    children: [jsx('test-page', {})],
  }),
);
```

Expected shape:

```html
<test-shell>
  <template shadowrootmode="open">...</template>
  <test-page>
    <template shadowrootmode="open">...</template>
  </test-page>
</test-shell>
```

Rules:

- `renderDsd()` renders the custom element shadow template.
- `renderNestedDsd()` renders the VNode children.
- The rendered children are inserted before the host closing tag.
- If `renderDsd()` falls back to a bare tag, children are still preserved.

### 2. Core public surface

File:

- `packages/core/src/index.ts`

Export:

```ts
export { renderNestedDsd, renderToString } from './jsx-render-string.js';
```

This lets generated SSR entries import the SSR backend directly.

### 3. Renderer API

File:

- `packages/core/src/types.ts`

`LessRenderer` wraps VNode trees, not HTML strings:

```ts
wrap(node: VNode, ctx): VNode | Promise<VNode>
```

This is a breaking change. It is intentional. String renderers are incompatible
with the single-tree model.

### 4. Adapter-vite route rendering

File:

- `packages/adapter-vite/src/entry-renderer.ts`

Generated page routes must use:

```ts
let node = jsx(tag, c.req.param() || {});
node = await renderer.default.wrap(node, c);
const content = await __renderAppShell(node, c.req.path || routePath);
```

They must not use:

```ts
const raw = await __ssr(tag, ...);
let content = raw;
content = await __renderAppShell(content, ...);
```

### 5. Adapter-vite app shell

Generated app shell helper must use a VNode root:

```ts
async function __renderAppShell(routeNode, routePath, options = {}) {
  return await renderNestedDsd(jsx('less-layout', {
    currentPath: routePath,
    locale,
    locales: __locales,
    navItems: __navSections,
    headerNav: __headerNav,
    home: isHome || undefined,
    children: [routeNode],
  }));
}
```

Forbidden:

```ts
layoutResult.html.replace('</less-layout>', content + '</less-layout>');
```

### 6. SSG renderRoute

The generated `renderRoute()` must build and render the same root tree:

```ts
let node = jsx(info.tagName, props);
for (const renderer of __matchingRenderers(routePath)) {
  node = await renderer.wrap(node, ctx);
}
const content = await __renderAppShell(node, routePath, { locale });
const fullHtml = wrapInDocument(content, ...);
```

Diagnostics can be derived from the rendered output until a tree-level collector
is added.

### 7. Cleanup

Remove all runtime parse5 references:

```powershell
Select-String -Path deno.json,packages/*/deno.json,packages/**/*.ts -Pattern 'parse5'
```

Allowed matches:

- ADR/SOP/changelog historical docs only

Forbidden matches:

- root `deno.json`
- package `deno.json`
- runtime source files

## Verification

Run focused checks first:

```powershell
deno test packages/core/__tests__/jsx-render-string.test.ts
deno test packages/adapter-vite/__tests__/entry-renderer.test.ts
deno check packages/core/src/index.ts packages/adapter-vite/src/entry-renderer.ts
```

Then run repo gates:

```powershell
deno task typecheck
deno task graph:check
cd www
deno task build
```

Build acceptance criteria:

- 351 HTML pages generated
- DSD report has 0 errors
- `www/dist/**` contains no `[object Object]`
- `www/dist/**` contains no `<dialog`
- representative docs pages contain `less-layout`, `docs-sidebar`,
  `less-search`, and `less-theme-toggle`

## Regression Checks

Use these checks after a docs build:

```powershell
Select-String -Path www/dist/zh/guide/getting-started/index.html -Pattern 'docs-sidebar'
Select-String -Path www/dist/zh/guide/getting-started/index.html -Pattern 'less-search'
Select-String -Path www/dist/zh/guide/getting-started/index.html -Pattern 'less-theme-toggle'
Select-String -Path www/dist/zh/guide/getting-started/index.html -Pattern '\[object Object\]'
Select-String -Path www/dist/zh/guide/getting-started/index.html -Pattern '<dialog'
```

Expected:

- first three commands find matches
- last two commands find no matches

## Follow-Up

The next improvement is a tree-level diagnostics collector for
`renderNestedDsd()`, so SSG reports can count nested components and hydration
hints without relying on HTML output scans.
