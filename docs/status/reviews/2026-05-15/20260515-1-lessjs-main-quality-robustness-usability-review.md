# 20260515-1 LessJS main quality, robustness, usability review

Date: 2026-05-15
Baseline: `origin/main` at `ac8ace6` (`Merge branch 'dev'`)
Source version line: all workspace packages in `packages/*/deno.json` are `0.14.6`
Reviewer focus: code quality, robustness, scaffold usability, release readiness, and the registry / SSR-SSG engine direction.

## Executive judgement

LessJS main is not a toy prototype anymore. The current codebase has real architectural substance: a split runtime/build adapter boundary, DSD rendering, nested custom element rendering through `parse5`, SSG through a self-contained SSR bundle, route metadata, i18n/content virtual modules, and broad unit coverage. The strongest technical asset is the DSD-first render path centered on `renderDsd()`, `renderNestedCustomElements()`, `RenderAdapter`, `renderRoute()`, and `PackageIslandMeta`.

The neutral assessment is also clear: the current `0.14.6` source tree is ahead of its release and scaffold guarantees. It is plausible as a framework foundation, but it is not yet reliable enough to market as "install any WC package and auto render it" or as a public webcomponents.org replacement. The next milestone should close release parity, package SSR registration, per-page island manifests, and CLI truthfulness before expanding the hub story.

Scorecard:

| Area                   | Score | Judgement                                                                                                                       |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| Code quality           | B     | Good modular split and test volume. Some generated-code complexity and stale constants remain.                                  |
| Robustness             | B-    | Core DSD paths are well covered, but package island SSR and release metadata are not robust yet.                                |
| Scaffold usability     | C+    | The scaffold builds in local tests, but help/name validation and remote JSR version resolution are unreliable.                  |
| Registry-hub readiness | C     | Direction is valid, but the required package manifest, trust model, indexing, and SSR contract are not implemented.             |
| Market direction       | B-    | Modern WC registry gap is real; LessJS should enter through SSR/SSG verification and package metadata, not a marketplace claim. |

## Validation performed

Commands run from `C:\Users\Administrator\WorkBuddy\Claw\lessjs-origin-main`:

| Command                                         | Result                                                                                                                                                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git status --short --branch`                   | Clean detached `origin/main` baseline before review.                                                                                                                                                       |
| `deno --version`                                | `deno 2.7.14`, TypeScript `5.9.2`.                                                                                                                                                                         |
| `deno task typecheck` before dependency install | Failed because `node_modules` was missing `npm:parse5@7.0.0`. Deno recommended `deno install`.                                                                                                             |
| `deno install --node-modules-dir`               | Installed cached npm dependencies. It also wanted to update `deno.lock` workspace member deps from `~0.14.2` to `~0.14.6`. That lockfile drift was reverted after validation and is recorded as a finding. |
| `deno task typecheck` after dependency install  | Passed.                                                                                                                                                                                                    |
| `deno task test`                                | Passed: `481 passed (217 steps), 0 failed`.                                                                                                                                                                |
| JSR meta check                                  | `https://jsr.io/@lessjs/core/meta.json` and `@lessjs/create/meta.json` currently report latest `0.14.2`, while repo source is `0.14.6`.                                                                    |
| JSR endpoint used by create                     | `https://jsr.io/@lessjs/core/meta` returns 404; the current API shape observed during review is `/meta.json` with `latest`, not `/meta` with `latestVersion`.                                              |

## High-priority findings

### P0 - Release parity is broken between source, lockfile, and registry

Evidence:

- `packages/*/deno.json` versions are `0.14.6`.
- `deno install --node-modules-dir` attempted to update `deno.lock` workspace member deps from `jsr:@lessjs/*@~0.14.2` to `~0.14.6`.
- JSR metadata currently reports latest `0.14.2` for `@lessjs/core` and `@lessjs/create`.
- `packages/adapter-vite/src/cli/build-ssg.ts` still has `FALLBACK_LESSJS_VERSION = '0.14.2'`.

Impact:

Fresh consumers and generated scaffolds can resolve an older published line even when the repository and changelog say `0.14.6`. This directly hurts trust in the first install path.

Recommended action:

1. Decide whether `0.14.6` is meant to be published now.
2. If yes, publish every package in dependency order and update `deno.lock` as part of the release commit.
3. Replace hardcoded fallback versions with the workspace version reader or a generated release constant.
4. Add a CI gate that fails when `packages/*/deno.json`, `deno.lock`, changelog, and registry metadata disagree after release.

### P0 - `@lessjs/create` remote version resolution is currently unreliable

Evidence:

- `packages/create/cli.ts` fetches `https://jsr.io/@lessjs/${pkg}/meta`, which returned 404 during review.
- The observed JSR metadata endpoint is `/meta.json`, and its field is `latest`, not `latestVersion`.
- `resolveVersions()` iterates every key in `PKG_DIR_MAP`, including `adapterVite`, but `jsrNames` omits `adapterVite`; remote execution would try to resolve an undefined package name.

Impact:

`deno run -A jsr:@lessjs/create my-app` can fail before writing a project or generate stale package versions. That undermines the "one command install" experience.

Recommended action:

1. Fix the endpoint and response parsing: `/meta.json`, `latest`, fallback to semver-sorted keys only if needed.
2. Add `adapterVite: 'adapter-vite'` to `jsrNames`.
3. Unit test remote resolution with a mocked `fetch`.
4. Add a smoke test against JSR metadata in release CI, but keep normal unit tests offline.

### P0 - Package islands are not SSR-registered as a general package protocol

Evidence:

- `packages/adapter-vite/src/entry-renderer.ts` builds `ssrIslands = desc.islands.filter((island) => !island.isPackage)`.
- Package islands are included in the client entry, but SSR imports and `customElements.define()` only cover local islands.
- `@lessjs/ui` works partially because `less-layout` imports `less-theme-toggle` as an implementation detail. That is not a generic package island SSR contract.

Impact:

The stated long-term goal, `xxx install xxx-wc` with automatic registration and automatic SSR/SSG rendering, is not achieved by the current package metadata path. The package can upgrade on the client but may not produce DSD on the server unless another imported module happens to register it.

Recommended action:

1. Treat package islands as first-class SSR inputs, not client-only inputs.
2. For each package island, import `modulePath` in the SSR bundle and register its default export or named class deterministically.
3. Extend `PackageIslandMeta` with `exportName`, `layer`, `ssr`, `hydrate`, and diagnostics fields before promising third-party package support.
4. Add an integration test with a synthetic external package island that is not imported by any page module.

### P1 - Per-page island manifest exists as utilities, but is not wired into SSG output

Evidence:

- `packages/adapter-vite/src/island-manifest.ts` implements `generateIslandManifests()` and `writeIslandManifests()`.
- `packages/adapter-vite/src/cli/ssg-render.ts` computes `_islandChunkMap = buildIslandChunkMap(...)` and does not use it.
- Current build injects a global client entry after Phase 2, not page-specific manifests.

Impact:

Docs and roadmap language about page-level island manifests overstates implementation. This matters for a registry hub because package evaluation should know which components are actually present on each route and which chunks they cost.

Recommended action:

1. Wire `buildIslandChunkMap()` to `generateIslandManifests()` and `writeIslandManifests()`.
2. Include local and package island strategies in the manifest generation.
3. Keep the global client entry as a compatibility mode until page-specific loading is proven.
4. Add SSG output tests that assert `dist/island-manifests/page-*.json` exists and matches actual HTML tags.

### P1 - Scaffold tests contain false positives around CLI behavior

Evidence:

- `packages/create/__tests__/cli.test.ts` uses `assertExists(boolean)` for many boolean expressions. `false` is still an existing value, so several assertions cannot fail as intended.
- The `--help` test expects exit code 0 and output containing help text, but `packages/create/cli.ts` has no explicit `--help` branch. The current behavior can pass by creating a project literally named `--help`.
- The "rejects project name with spaces" test allows success if output mentions the name, and `cli.ts` has no project-name grammar validation beyond path escape / existing directory checks.
- Version expectations still look for old substrings such as `0.2`, `0.7`, `0.8`, and `0.10`, not the current `0.14.6` line.

Impact:

The tests report more scaffold confidence than they actually prove. This is a direct usability risk because `create` is the first user touchpoint.

Recommended action:

1. Replace boolean `assertExists()` with `assertEquals(value, true)` or `assert(value)`.
2. Implement and test `--help` / `-h` without filesystem writes.
3. Reject unsafe package names explicitly: spaces, path separators, reserved names, and hidden relative segments.
4. Validate generated import versions against `buildTemplates(v)` with injected `0.14.6` data instead of old hardcoded substrings.

## Medium-priority findings

### P2 - DSD polyfill comments and injection policy need modernization

Evidence:

- `packages/adapter-vite/src/ssg-postprocess.ts` says Firefox does not support `shadowrootmode` as of 2025 and injects a feature-detecting DSD polyfill into every generated HTML file.
- Current external references show DSD is now part of the standardized platform surface: WHATWG lists `shadowrootmode`, `shadowrootclonable`, and `shadowrootserializable`; MDN documents declarative shadow DOM on `<template>`.

Impact:

The feature detection is defensive, but unconditional injection makes the output look less modern than the framework's positioning. A registry hub should report compatibility and progressive enhancement clearly.

Recommended action:

1. Change the wording to "legacy / unsupported browsers" instead of naming Firefox as unsupported.
2. Add an option such as `compatibility.dsdPolyfill: 'auto' | 'always' | 'never'`.
3. Track browser compatibility in docs as a supported-target policy, not a hardcoded comment.

### P2 - `PackageIslandMeta` is too small for a registry protocol

Evidence:

- Current interface has `tagName`, `modulePath`, and optional `strategy`.
- `@lessjs/ui` exports enough metadata for client import but not enough for scoring, documentation, accessibility reporting, form participation, CSS parts, events, slots, or SSR diagnostics.
- The wider ecosystem already has Custom Elements Manifest as a known manifest shape.

Impact:

LessJS can discover package islands, but cannot yet evaluate or document them like a modern registry. A hub without richer metadata becomes a package list, not infrastructure.

Recommended action:

1. Make the next manifest CEM-compatible rather than inventing a fully separate schema.
2. Add LessJS-specific fields only where CEM does not cover runtime behavior: `ssr`, `dsd`, `hydrate`, `strategy`, `renderAdapter`, `entrypoints`, `testMatrix`, `securityNotes`.
3. Treat Open UI concepts as contract vocabulary for parts/states/behavior, not as a dependency on OpenWC templates.

## Market and future assessment

The user's target, a modern replacement for webcomponents.org, is directionally valid. The old webcomponents.org ecosystem is historically tied to Polymer/Bower-era catalog assumptions, while modern package discovery has moved toward npm/JSR metadata, CEM, docs generation, design-system proof, and SSR/SSG compatibility.

The realistic wedge is not "a marketplace" first. It is a verification hub:

1. Given a package, LessJS can discover its custom elements metadata.
2. Given a component, LessJS can prove whether it can render DSD/SSG safely.
3. Given a route, LessJS can show which components and chunks are actually used.
4. Given a release, LessJS can compare CEM/API/SSR behavior and flag breaking changes.
5. Given a user, LessJS can produce copy-paste install instructions and a working scaffold.

That wedge is defensible because it ties directly to the repo's existing strengths. A general full-stack platform, auth/ORM story, or broad multi-framework wrapper market would dilute the project before the renderer protocol is stable.

## Recommended roadmap sequencing

### v0.15 - Release parity and renderer-kernel hardening

Exit criteria:

- `@lessjs/create` remote mode resolves correct JSR versions and has real CLI help/name validation.
- Package islands can SSR-register from metadata, not only client-upgrade.
- SSG emits or explicitly defers page island manifests; no half-implemented manifest utilities remain hidden.
- `deno.lock`, package versions, changelog, and registry versions are aligned.
- Release validation runs `typecheck`, `test`, scaffold smoke, and at least one package-island SSR integration case.

### v0.16 - WC package protocol

Exit criteria:

- Define a CEM-compatible package manifest plus LessJS SSR/DSD extensions.
- Add manifest validation CLI/API.
- Add docs pages generated from package metadata.
- Add adapter contract diagnostics for DSD renderability.

### v0.17 - Local registry index

Exit criteria:

- Build a local registry index from workspace packages and explicitly installed packages.
- Show component pages with tags, module path, SSR status, DSD status, events, parts, tokens, package version, and generated examples.
- Add package quality scoring based on tests, docs, CEM completeness, SSR result, accessibility notes, and bundle cost.

### v0.18 - Public hub prototype

Exit criteria:

- Publish a static hub prototype backed by signed or reproducible metadata.
- Keep review and governance minimal: no broad marketplace promise before moderation, abuse handling, security reporting, and package provenance are designed.

## SOP for each roadmap slice

1. Start with a repo-backed fact sheet: source version, registry version, lockfile status, route/build validation, and current failing contracts.
2. Write one ADR or decision file before changing protocol surfaces.
3. Add the smallest integration test that proves the new contract against a real generated app or synthetic package.
4. Update docs only after the test proves the feature.
5. Run `deno task typecheck`, `deno task test`, and a scaffold smoke.
6. Before release, run a clean-worktree publish dry run and compare registry metadata after publish.
7. Only then update marketing language, roadmap, or hub pages.

## External references used for market / standards checks

- WHATWG HTML Standard, template / declarative shadow DOM attributes: https://html.spec.whatwg.org/multipage/semantics-scripting.html
- MDN `<template>` element, declarative shadow DOM attributes: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template
- Custom Elements Manifest repository: https://github.com/webcomponents/custom-elements-manifest
- Open UI Community Group: https://www.w3.org/groups/cg/open-ui and https://open-ui.org/
- Polymer announcement of webcomponents.org as a catalog replacement for older Polymer elements catalog: https://www.polymer-project.org/blog/2017-01-09-webcomponents-org
