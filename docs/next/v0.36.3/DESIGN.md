# v0.36.3 Design — Complete SSG File Ownership Migration

## Architecture

After v0.36.2, `@openelement/ssg` owns the Vite-free SSG render (`ssgRender`)
and postprocess helpers. v0.36.3 completes the migration by moving the
remaining SSG-related modules out of `adapter-vite`.

## Module Relocation

```
adapter-vite/src/cli/ssg.ts              → ssg/src/cli/ssg.ts
adapter-vite/src/external-resolver.ts    → ssg/src/external-resolver.ts
adapter-vite/src/ssr-polyfills.ts        → ssg/src/ssr-polyfills.ts
adapter-vite/src/entry-descriptor.ts     → ssg/src/entry-descriptor.ts
adapter-vite/src/entry-renderer.ts       → ssg/src/entry-renderer.ts
adapter-vite/src/route-scanner.ts        → ssg/src/route-scanner.ts
adapter-vite/src/route-type-generator.ts → ssg/src/route-type-generator.ts
adapter-vite/src/hub-client-only-tags.ts → ssg/src/hub-client-only-tags.ts
adapter-vite/src/generated-data-resolver.ts → ssg/src/generated-data-resolver.ts
adapter-vite/src/ssg-package-resolver.ts → ssg/src/ssg-package-resolver.ts
```

## Dependency Model

```
@openelement/ssg
  ├── @openelement/core (existing)
  ├── hono (existing)
  ├── typescript (new, for AST in route-scanner)
  └── vite (new, for Vite plugin types in generated-data-resolver, ssg-package-resolver)

@openelement/adapter-vite
  └── @openelement/ssg (imports all SSG logic from here)
```

## Public API Surface

`@openelement/ssg` will export:

- `ssgRender()`, `renderSequential()`, `renderParallel()` — render pipeline
- `scanRoutes()`, `scanIslands()` — route scanning
- `generateRouteTypes()` — type generation
- `generateHonoEntryCode()` — entry code generation
- `buildEntryDescriptor()` — entry data model
- `generateSsrPolyfillBanner()` — SSR polyfills
- `resolveExternalManifest()` — external dependency resolution
- `generatedDataPlugin()` — Vite plugin for generated data
- `ssgPackageResolverPlugin()` — Vite plugin for JSR package resolution
- All postprocess helpers (existing from v0.36.2)

## Non-Goals

- Breaking public API changes
- Changing Vite dev server behavior
- Removing adapter-vite (it remains as Vite orchestration shell)
- Cross-browser E2E fixes (v0.36.4)
- Server/Data/UI product closure (v0.37.0)
