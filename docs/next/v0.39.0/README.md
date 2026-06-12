# v0.39.0 NextVersion

v0.39.0 is the Framework RC + Four-Product Matrix Reset line.

It starts from the v0.38.0 product surface reset and proves that the documented
framework surface works as a generated, deployable, consumer-verified app
without silently expanding package scope before v1.0. ADR-0099 also resets the
public target to `openElement = Elements + UI + Framework + Protocols`.

## Scope

### Generated App Proof

- [x] Generate or refresh the starter app path using the v0.38 first-run
      surface.
- [x] Prove pages, layouts, islands, API routes, static output, SSR/ISR intent,
      assets, and zero-JS defaults through a repeatable smoke.
- [x] Verify starter import maps and tasks do not expose archived/internal
      surfaces as first-run APIs.

### Deployment Proof

- [x] Validate the documented Vite + Nitro runtime/deploy path.
- [x] Record platform boundaries for request/response, assets, cache intent,
      API routes, and island chunks.
- [x] Keep provider-specific behavior in recipes or adapter boundaries.

### Docs And Consumer Surface

- [x] Align root docs, website guide/API/deployment pages, package READMEs, and
      generated templates with the RC surface.
- [x] Align public docs to ADR-0099: Elements, UI, Framework, and Protocols.
- [x] Replace stale README version truth and repair README.zh mojibake.
- [x] Add a public docs integrity gate for package line, active line, product
      matrix, and mojibake.
- [x] Record migration notes for any intentional 0.x breaking behavior.
- [x] Prove consumer smoke against the RC surface before package bump.

### Elements And Adapter Direction

- [x] Record `@openelement/elements` and `OpenElement` as the future Elements
      product direction.
- [x] Record that `DsdElement` is superseded as public product terminology and
      that v0.39 does not promise a long-term compatibility alias.
- [x] Keep Web Awesome out of the current UI target.
- [x] Plan Vue as the only heavy-framework island adapter proof for this line.

## Current Evidence

- v0.38.0 is tagged and released.
- All 20 workspace packages are now aligned to `0.39.0` after local
  implementation gates passed.
- The v0.38 product map defines product, advanced, internal, and archived
  surfaces.
- ADR-0099 supersedes the v0.38 package-name deferral for future work and
  approves the four-product matrix.
- ADR-0100 restores JSR publish as a release exit gate for v0.39+ closure.
- `deno task consumer:local` now generates a starter app from local
  `@openelement/create`, patches imports to workspace source packages, builds
  through the generated Vite + openElement path, and verifies the generated
  home page, app shell layout marker, API route scan evidence, public asset,
  freshness page, and ISR/cache intent route.
- The generated consumer smoke exposed and fixed a missing workspace alias for
  `@openelement/protocols/*` subpaths during client island build.
- `@openelement/create` now emits `app/components/app-shell.tsx` and
  `app/routes/api/health.ts` so generated apps exercise layout and API route
  surfaces by default.
- `@openelement/create` now emits `app/routes/freshness.tsx` with
  `renderIntent.revalidate = 300` and `public/openelement-mark.svg`, proving
  ISR/cache intent and static asset copy behavior in the generated app.
- `deno task consumer:local` also writes a temporary Nitro catch-all, mounts
  the generated `dist/server/entry.js` through `createOpenElementNitroHandler`,
  builds Nitro `node-server` output, starts it with Node, and verifies `/`,
  `/freshness`, `/api/health`, and `/openelement-mark.svg`.
- Migration notes for the ADR-0099 terminology reset are recorded in
  `docs/next/v0.39.0/MIGRATION.md`.
- ADR-0100 records the JSR publish policy reset after JSR recovery.
- Local v0.39 release-shape gates now pass: workflow, graph, architecture,
  public/current/strategy docs, format, lint, typecheck, test, Chromium E2E,
  build, DSD report, generated consumer, and publish dry-run.
- Website deployment docs now describe static host boundaries, Nitro runtime
  recipes, API route deployment, and cache/ISR intent without turning provider
  presets into new openElement products.

## Related

- SOP: `docs/sop/v0.39.0/README.md`
- Prior line: `docs/next/v0.38.0/`
- Product map: `docs/next/v0.38.0/PRODUCT_MAP.md`
- Roadmap: `docs/roadmap/ROADMAP.md`
- Status: `docs/status/STATUS.md`
