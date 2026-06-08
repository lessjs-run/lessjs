# v0.36.3 SOP: Complete SSG File Ownership Migration

> Status: Planned\
> Roadmap: Complete SSG File Ownership Migration\
> NextVersion: `docs/next/v0.36.3/`

## Goal

Finish the SSG file ownership migration that began in v0.36.2. Move the
remaining SSG-related files out of `adapter-vite` into `@openelement/ssg`, so
the SSG engine is fully self-contained and does not depend on adapter-vite
internal types.

## Tasks

- [ ] Move route scanner from `adapter-vite` to `@openelement/ssg`.
- [ ] Move route type generation to `@openelement/ssg`.
- [ ] Move virtual entry generator to `@openelement/ssg`.
- [ ] Move SSG-specific Vite plugin orchestration to `@openelement/ssg`.
- [ ] Move generated data resolver (blog, nav, search, i18n bridges) to `@openelement/ssg`.
- [ ] Remove bridge-only compatibility exports from `adapter-vite`.
- [ ] Ensure `@openelement/ssg` can be consumed without adapter-vite internal types.
- [ ] Add tests proving SSG engine works independently of adapter-vite.
- [ ] Update all internal imports to use new `@openelement/ssg` paths.
- [ ] Bump all 20 packages to 0.36.3.

## Verification

Required release gates:

```bash
deno task workflow:check
deno task fmt:check
deno task lint
deno task typecheck
deno task graph:check
deno task autoflow:test
deno task autoflow:health
deno task autoflow:check
deno task test
deno task build
deno task dsd:check-report
deno task publish:dry-run
deno task test:e2e
```

## Non-Goals

- Do not fix Firefox/WebKit E2E issues (deferred to v0.36.4).
- Do not start Server/Data/UI/starter/Hub product closure (deferred to v0.37.0).
- Do not change public API surface beyond SSG import paths.

## Exit Criteria

- `@openelement/ssg` owns all SSG-related code: render, postprocess, route scanning, entry generation, data resolution.
- `adapter-vite` no longer contains SSG-specific files; it only provides Vite build orchestration glue.
- Bridge-only compatibility exports are removed.
- Root build still generates the same static site output.
- All release gates pass.

## Related

- [ADR-0086: AI-Readable Architecture and AutoFlow Roadmap](../../adr/ADR-0086-ai-readable-architecture-and-autoflow2-roadmap.md)
