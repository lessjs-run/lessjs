# v0.36.2 Design

## Boundary

v0.36.2 creates a bridge boundary between Vite orchestration and Vite-free SSG
execution.

`@openelement/adapter-vite` keeps:

- Vite SSR bundle build.
- Virtual entry generation.
- Route, island, renderer, middleware, and API scanning.
- Alias, noExternal, optional package stubs, and plugin orchestration.
- Generated data resolver and JSR package resolver.

`@openelement/ssg` owns:

- `ssgRender()` and `resolveDynamicRoutePath()`.
- SSG page output, bundle, render options, and evidence types.
- HTML postprocess helpers.
- Sequential and parallel render helpers.
- ISR manifest entry generation using core cache keys.

## Evidence Contract

The migrated render core does not depend on `OpenElementBuildContext`.
Adapter-specific build data is passed through `SsgRenderEvidence`:

- i18n locales.
- local island hydration metadata.
- package island declarations and manifests.
- SSR admission decisions.
- CEM classifications.
- build manifest and sitemap callbacks.

This keeps `@openelement/ssg` Vite-free while preserving the same release
reports and static output hooks.

## Compatibility

Adapter-vite keeps compatibility modules:

- `packages/adapter-vite/src/cli/ssg-render.ts`
- `packages/adapter-vite/src/ssg-postprocess.ts`

These modules re-export or wrap `@openelement/ssg` so existing internal imports
continue to work during the bridge line.

## ISR Manifest

SSG output writes ISR manifest entries as `IsrManifestEntry[]`:

```ts
{
  path: string;
  revalidate: number;
  cacheKey: string;
  params: Record<string, string>;
}
```

The cache key is always produced with `createIsrCacheKey()` from
`@openelement/core`.
