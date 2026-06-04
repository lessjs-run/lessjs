# ADR-0073: AppShell Protocol

- Status: Accepted, Implemented
- Date: 2026-06-02
- Version: v0.28.4

## Context

Before v0.28.4, the generated SSR/SSG entry always imported
`@openelement/ui\/open-layout` and rendered `<open-layout>` around every page. That
worked for the LessJS documentation site, but it made the framework shell an
implicit package-resolution side effect.

Application authors who wanted a blog layout, product shell, marketing page, or
route-specific reading layout had to override `@openelement/ui\/open-layout` with
aliases. That was fragile because the SSG package resolver also handles
`@openelement/*` specifiers early in the Vite pipeline.

The v0.28.4 cleanup policy also removed compatibility-only surfaces. A layout
protocol needed to be explicit, testable, and descriptor-driven instead of
being another hidden default.

## Decision

LessJS treats the application shell as entry-generation configuration:

```ts
lessjs({
  appShell: false,
});
```

`false` renders route content directly.

```ts
lessjs({
  appShell: 'default',
});
```

`'default'` renders the framework default shell, currently
`@openelement/ui\/open-layout` as `<open-layout>`.

```ts
lessjs({
  appShell: {
    tagName: 'site-layout',
    import: './app/components/site-layout.tsx',
    props: {
      siteName: 'Field Notes',
    },
  },
});
```

Object form imports a user component and renders it as the shell. Static props
are merged with generated layout context such as `currentPath`, `locale`,
`locales`, `navItems`, `headerNav`, `home`, and `routeMeta`.

Route modules may select a named layout:

```ts
export const meta = {
  layout: 'post',
};
```

The matching configuration is:

```ts
lessjs({
  layouts: {
    default: {
      tagName: 'site-layout',
      import: './app/components/site-layout.tsx',
    },
    post: {
      tagName: 'post-layout',
      import: './app/components/post-layout.tsx',
    },
    bare: false,
  },
});
```

The generated entry reads `routeModule.meta.layout` at runtime and selects the
configured shell from the descriptor. `meta.layout = false` also renders that
route without a shell.

## Boundaries

- `@openelement/ui\/open-layout` is the default implementation, not the framework
  contract.
- The descriptor records normalized shell imports, tags, and props before
  rendering code is generated.
- SSG no longer hard-codes a side-effect import for `@openelement/ui\/open-layout`.
- Exact user aliases win before the LessJS package resolver handles `@openelement/*`.
- Default `less-layout` branding is configurable and may be omitted.

## Consequences

Applications can use LessJS for docs, blogs, product sites, and landing pages
without aliasing an internal framework package or manually nesting shells inside
route components.

The default remains source-compatible for apps that do not configure AppShell:
`appShell` defaults to `'default'`. The API is still stricter because custom
shell behavior is now represented as explicit configuration rather than resolver
override behavior.

Static `props` are intentionally the v0.28.4 contract. Function props are not
shipped in this release because they would need a typed route/content context
contract and a serialization story for SSG descriptor generation.

This ADR supersedes the implicit AppShell portion of ADR-0070. ADR-0070 remains
valid for generated data namespace boundaries.
