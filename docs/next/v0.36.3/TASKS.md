# v0.36.3 Tasks — Complete SSG File Ownership Migration

## Tier 1: Zero-Dependency Moves (no Vite imports)

- [ ] Move `src/cli/ssg.ts` standalone SSG CLI to `@openelement/ssg/src/cli/ssg.ts`
- [ ] Move `src/external-resolver.ts` to `@openelement/ssg/src/external-resolver.ts`
- [ ] Move `src/ssr-polyfills.ts` to `@openelement/ssg/src/ssr-polyfills.ts`

## Tier 2: Core Engine Moves (used by both dev and SSG)

- [ ] Move `src/entry-descriptor.ts` data model to `@openelement/ssg/src/entry-descriptor.ts`
- [ ] Move `src/entry-renderer.ts` code generation to `@openelement/ssg/src/entry-renderer.ts`
- [ ] Move `src/route-scanner.ts` filesystem + AST scanning to `@openelement/ssg/src/route-scanner.ts`
- [ ] Move `src/route-type-generator.ts` to `@openelement/ssg/src/route-type-generator.ts`
- [ ] Move `src/hub-client-only-tags.ts` to `@openelement/ssg/src/hub-client-only-tags.ts`

## Tier 3: Vite Plugin Moves (SSG-specific Vite plugins)

- [ ] Move `src/generated-data-resolver.ts` Vite plugin to `@openelement/ssg/src/generated-data-resolver.ts`
- [ ] Move `src/ssg-package-resolver.ts` Vite plugin to `@openelement/ssg/src/ssg-package-resolver.ts`

## Tier 4: Adapter-Vite Cleanup

- [ ] Update adapter-vite imports to use `@openelement/ssg` paths
- [ ] Add compatibility re-exports in adapter-vite for migrated modules
- [ ] Update `@openelement/ssg` deno.json exports and index.ts
- [ ] Update `@openelement/adapter-vite` deno.json and index.ts

## Tier 5: Verification

- [ ] Add tests proving SSG engine works independently of adapter-vite
- [ ] Run all gate checks
- [ ] Bump all 20 packages to 0.36.3
- [ ] Update STATUS.md, ROADMAP.md, changelog, release note
