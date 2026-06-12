# v0.39.0 Tasks

## A. Generated App RC

- [x] Generate or refresh a starter app from the current create-template path.
- [x] Verify app authoring, pages, layouts, islands, API routes, static output,
      SSR/ISR intent, and assets.
- [x] Verify generated imports use product surfaces by default.

## B. Runtime And Deployment

- [x] Validate the Vite + Nitro runtime path with the generated app.
- [x] Record request, asset, API route, cache, and island chunk boundaries.
- [x] Record provider-specific deployment notes outside the framework core.

## C. Documentation And Migration

- [x] Add ADR-0099 for the four-product matrix and Elements reset.
- [x] Align root README, README.zh, website docs, package READMEs, and generated
      templates with the RC surface.
- [x] Align public docs to `openElement = Elements + UI + Framework + Protocols`.
- [x] Fix README.md stale package/active-line claims.
- [x] Rewrite README.zh.md as valid UTF-8 Chinese.
- [x] Add and wire a public docs integrity gate.
- [x] Add migration notes for intentional 0.x behavior changes.
- [x] Keep archived/internal packages out of first-run guides.

## D. Elements And Vue Adapter Planning

- [x] Record `@openelement/elements` and `OpenElement` as the future Elements
      product direction.
- [x] Record that `DsdElement` is superseded as public product terminology and
      is not promised as a long-term compatibility alias.
- [x] Record Web Awesome as out of current product strategy and implementation
      scope.
- [x] Plan Vue as the only heavy-framework island adapter proof.

## E. Gates

- [x] Run workflow, graph, architecture, docs, format, lint, typecheck, test,
      build, E2E, generated consumer, and publish dry-run gates.
- [x] Run `deno task docs:check-public`.
- [x] Record AutoFlow evidence and release-truth state.
