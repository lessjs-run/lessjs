# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version: 0.17.4

## Next Planned Version: 0.18.0

v0.17.4 is closed as the compatibility-boundary hardening release. v0.18.0 is
the next implementation target and must turn the conservative admission plan
into CEM/manifest-based validation.

## Branch Status

| Branch        | HEAD      | Status                                             |
| ------------- | --------- | -------------------------------------------------- |
| `origin/dev`  | `3b5db70` | v0.17.4 compatibility hardening + second-round fix |
| `origin/main` | `249d704` | v0.17.2 release                                    |

## Tags

| Tag      | Commit    | Date       |
| -------- | --------- | ---------- |
| v0.17.4  | `3b5db70` | 2026-05-16 |
| v0.17.3  | `be3cf0c` | 2026-05-16 |
| v0.17.2  | pending   | 2026-05-16 |
| v0.17.1  | `08f267d` | 2026-05-16 |
| v0.17.0  | `1f93fa2` | 2026-05-16 |
| v0.16.0  | `a02feb6` | 2026-05-16 |
| v0.15.3  | `5e06fc9` | 2026-05-16 |
| v0.15.2  | `64dadd8` | 2026-05-16 |
| v0.15.1  | `dd36eea` | 2026-05-16 |
| v0.14.11 | `32dcc7c` | 2026-05-16 |

## Last Completed Release: 0.17.4 (2026-05-16)

### First Round (Initial Tag)

- **SSR admission plan**: entry generation now uses explicit
  renderable/client-only decisions instead of importing every island into SSR.
- **Static local island metadata**: `less.ssr`, `less.dsd`, and
  `less.hydrate` are scanned without importing browser-only island modules.
- **Browser-only package boundary**: packages that require browser globals
  during manifest discovery are skipped conservatively instead of breaking the
  docs build.
- **Optional adapter stubs**: Lit, Vanilla, and React adapters resolve as
  optional packages in both the main Vite build and SSG sub-build.
- **Build exit fix**: one-command build exits cleanly after successful Vite
  completion.
- 554 tests passing, 92 e2e passing, fmt/lint/typecheck/audit/build clean at
  release gate time.

### Second Round (Post-Tag Fixes)

- **SW cache robustness**: navigate requests use `networkFirst` with offline
  fallback; asset `cacheFirst` uses try/catch on fetch failures; non-asset
  requests pass through without SW interception.
- **Package island SSR admission**: package islands with `ssr: true` manifest
  metadata (e.g., `@lessjs/ui/less-layout`) now take the `ssr+client` path
  instead of being forced to `client-only`.
- **Nested DSD rendering**: removed `isInsideDsdTemplate()` guard that
  prevented custom elements inside parent DSD shadow DOM from receiving their
  own DSD templates. `less-layout` now has full DSD in SSG output.
- 554 tests passing; build produces 298 pages with 13 DSD templates each.

### Third Round (2026-05-17)

- **Vanilla adapter render fallback**: `WithDsdHydration(HTMLElement)` mixin now
  auto-calls `render()` when no DSD content exists (ssr:false islands). Fix in
  mixin layer, not per-island — all vanilla adapter consumers benefit.
- 554 tests passing; build produces 298 pages.

## Known Issues

- 3 JSR `unanalyzable-dynamic-import` warnings in adapter-vite are expected for
  runtime-only deps and do not block publish.
- Docs showcase chunks intentionally exceed the old 200KB total JS budget. The
  gate now tracks core and showcase budgets separately; v0.18+ should add
  package-level bundle classification.
- Browser-only packages skipped during manifest discovery are not validated
  packages yet. v0.18 must replace this with CEM/manifest validation.
- Package islands rely on side-effect `customElements.define()` from module
  imports for SSR registration. v0.18 should formalise this in the admission
  plan rather than relying on side effects.

## Active Rule

Third-party package handling is conservative:

- explicit supported SSR metadata -> SSR/SSG
- `ssr: false` or unknown CEM-only package -> client-only
- invalid metadata, duplicate tags, unsafe paths -> rejected before build
- DOM simulation -> experimental opt-in only

## Version Ladder With Admission And Exit Gates

| Version | SOP                                                    | Status       | Entry Gate                                                           | Exit Gate                                                 |
| ------- | ------------------------------------------------------ | ------------ | -------------------------------------------------------------------- | --------------------------------------------------------- |
| v0.17.3 | `docs/sop/v0.17.3-multi-framework-adapters.md`         | Done         | v0.17.2 SSR filtering exists                                         | Vanilla/React adapters documented; no universal SSR claim |
| v0.17.4 | `docs/sop/v0.17.4-compatibility-boundary-hardening.md` | Done         | v0.17.3 docs closed                                                  | Client-only modules excluded before SSR entry generation  |
| v0.18.0 | `docs/sop/v0.18.0-universal-wc-engine.md`              | Next         | v0.17.4 admission planner complete + package SSR admission validated | CEM parser + compatibility tiers + report reasons         |
| v0.18.1 | `docs/sop/v0.18.1-validate-manifest-cli.md`            | Planned      | v0.18.0 classifier stable                                            | `less validate-manifest` emits stable diagnostics         |
| v0.18.2 | `docs/sop/v0.18.2-less-add-install-flow.md`            | Planned      | validation CLI stable                                                | `less add` dry-run/install is validation-gated            |
| v0.18.3 | `docs/sop/v0.18.3-dom-simulation-experiment.md`        | Experimental | client-only fallback stable                                          | opt-in DOM simulation decision recorded                   |
| v0.19.0 | `docs/sop/v0.19.0-platform-hub.md`                     | Planned      | validation/build reports stable                                      | Hub ingests artifacts and shows compatibility             |
| v0.19.1 | `docs/sop/v0.19.1-hub-previews-quality-gates.md`       | Planned      | Hub ingestion MVP stable                                             | previews/quality gates reflect validation evidence        |
| v1.0.0  | `docs/sop/v1.0.0-general-purpose-engine.md`            | Vision       | engine, reports, add flow, Hub records stable                        | API/schema freeze with deterministic package outcomes     |

## Operator Checklist

Before starting any version:

1. Read this STATUS file.
2. Read the target version SOP.
3. Confirm entry criteria are true.
4. Implement only the target SOP scope.
5. Run verification commands listed in the SOP.
6. Update changelog and STATUS only after exit criteria pass.

## JSR Publish Order

1. `@lessjs/rpc` (no LessJS deps)
2. `@lessjs/signals` (no LessJS deps)
3. `@lessjs/core` (no LessJS deps) - must be published before all others
4. `@lessjs/adapter-lit` (depends on core only)
5. `@lessjs/adapter-vanilla` (depends on core only)
6. `@lessjs/adapter-react` (depends on core only)
7. `@lessjs/content` (depends on core only)
8. `@lessjs/i18n` (depends on core only)
9. `@lessjs/adapter-vite` (depends on core only; sitemap via dynamic import at
   runtime)
10. `@lessjs/ui` (depends on core + adapter-lit)
11. `@lessjs/app` (depends on core + adapter-vite + content + i18n)
12. `@lessjs/create` (JSR only)

## Historical Reviews

Archived in [docs/status/reviews/](./reviews/) and organized by date.

| Date       | Directory                            | Description                         |
| ---------- | ------------------------------------ | ----------------------------------- |
| 2026-05-13 | [2026-05-13/](./reviews/2026-05-13/) | Full team audit                     |
| 2026-05-14 | [2026-05-14/](./reviews/2026-05-14/) | Follow-up audit                     |
| 2026-05-15 | [2026-05-15/](./reviews/2026-05-15/) | Quality/robustness/usability review |
| 2026-05-16 | [2026-05-16/](./reviews/2026-05-16/) | Full audit + fix tracker            |
