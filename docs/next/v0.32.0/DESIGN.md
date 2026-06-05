# v0.32.0 Design: App Lifecycle Contract

## Design Goal

The application author should write JSX pages while the framework owns the
lifecycle around them. The public contract is `definePage()` plus lifecycle
helpers, not direct Hono route code and not `DsdElement` inheritance.

## Lifecycle Order

1. scan file route and static metadata;
2. match route and derive params;
3. build `PageLoadContext`;
4. run `load()` if present;
5. create the page VNode with framework-owned hidden props;
6. render page VNode through the existing JSX/VNode/DSD pipeline;
7. resolve AppShell/layout from structured route metadata;
8. wrap the result in the HTML document;
9. convert lifecycle control errors to redirect or not-found responses;
10. use the page error renderer when a normal render error occurs.

## Public API

`@openelement/app` exports:

- `definePage()`
- `defineIsland()`
- `defineElement()`
- `defineLayout()`
- `redirect()`
- `notFound()`
- `OpenElementRedirect`
- `OpenElementNotFound`
- `isOpenElementRedirect()`
- `isOpenElementNotFound()`

## Context Shape

`load(ctx)` receives:

- `params`
- `request`
- `env`
- `platform`
- `route.path`
- `route.filePath`

`render(ctx)` receives:

- `data`
- `params`
- `request`
- `route`
- `meta`
- public props

The framework may pass internal props prefixed with `__openElement`, but those
props must never leak into public props or rendered attributes.

## Error Model

Redirect and not-found are lifecycle control errors. They are thrown from
`load()` or application code and caught by the framework boundary.

Generic errors remain errors. If a page provides `error(ctx)`, the framework
renders it through the same VNode pipeline. Otherwise the existing development
or production error response is used.

## Non-Goals

This version does not define cache freshness, ISR behavior, streaming transport,
or deployment-host semantics. Those belong to v0.33.
