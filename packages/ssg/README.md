# @openelement/ssg

Vite-free static site generation utilities for openElement.

This package owns the SSG render engine, page output types, HTML
post-processing helpers, and sequential/parallel render helpers. In v0.36.2,
`@openelement/adapter-vite` still builds the Vite SSR bundle and then delegates
the Vite-free render and post-processing work to this package.

## Install

```bash
deno add jsr:@openelement/ssg
```

## Usage

```ts
import { ssgRender } from '@openelement/ssg';

await ssgRender(ssrBundle, {
  root: Deno.cwd(),
  outDir: 'dist',
  base: '/',
});
```

Most applications should continue to use `openElement()` from
`@openelement/app/vite`. Direct `@openelement/ssg` imports are intended for
build tooling and adapter integration.

## Scope

This package is intentionally Vite-free. Vite-specific entry generation, SSR
bundle building, route scanning, aliasing, and plugin orchestration remain in
`@openelement/adapter-vite` for the v0.36.2 bridge line.

## License

MIT
