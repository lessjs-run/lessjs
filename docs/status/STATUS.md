# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version Line: v0.21.0

Status: **Hydration strategy contract, ISR primitives, and API route production
parity implemented.**

The current product center is:

> DSD-first Web Components application framework with SSG, progressive islands,
> Hono API routes, and early Registry Hub evidence.

See [ADR-0037](../adr/0037-dsd-first-strategic-boundary.md) for the public
positioning boundary.

## Current Rendering Mode

| Mode                 | State   | Notes                                             |
| -------------------- | ------- | ------------------------------------------------- |
| SSG                  | shipped | default production rendering mode                 |
| DSD                  | shipped | `renderDSD()` outputs declarative shadow roots    |
| Island upgrade       | shipped | binary SSR/client-only boundary exists            |
| Hydration strategies | shipped | `client:load/idle/visible/only` strategy contract |
| ISR                  | shipped | cache primitives and SSG `isr-manifest.json`      |
| Request-time SSR     | later   | runtime adapters are not a v0.21 guarantee        |

## Package Version State

The repository currently has a staggered package-version state:

| Package group                   | Version state                                     |
| ------------------------------- | ------------------------------------------------- |
| `@lessjs/ui`                    | v0.20.0 line                                      |
| `@lessjs/hub`                   | v0.19.0 line                                      |
| most core/adapters/app packages | v0.18.3 package version until coordinated publish |

This status file tracks the project line. Package versions should be aligned in
a dedicated publish/release SOP, not silently changed during docs work.

## Architecture Positioning

LessJS has three product pillars:

1. **Application framework** - file routes, dev server, build pipeline, Hono API
   routes, deployment path.
2. **DSD/WC rendering engine** - `DsdElement`, `renderDSD()`, adapters,
   `StyleSheet`, compatibility admission, `dsd-report.json`.
3. **Registry Hub** - discovery, validation, one-command install, snapshots.

The strongest current moat is pillar 2 plus the Hub evidence pipeline. Full
stack breadth is intentionally sequenced after runtime adapters and broader
deployment parity.

## Completion by Pillar

| Pillar                  | Completion | Main gap                                                   |
| ----------------------- | ---------- | ---------------------------------------------------------- |
| Application framework   | ~58%       | runtime adapters, deployment parity, auth/data patterns    |
| DSD/WC rendering engine | ~86%       | Signals integration, broader third-party coverage          |
| Registry Hub            | ~55%       | package count, self-service governance, hermetic snapshots |
| Overall                 | ~67%       | product coherence and ecosystem scale                      |

Percentages are planning estimates, not release promises.

## Last Completed Line: v0.21.0

Delivered:

- `client:load`, `client:idle`, `client:visible`, and `client:only`.
- Page-level island manifest strategy metadata.
- Client-only SSR exclusion for `client:only`.
- ISR cache primitives and SSG `isr-manifest.json` emission.
- API routes support default-exported Hono apps and function handlers.
- `DsdBuildReport.hydrationStrategySummary`.
- `DsdElement` zero-dependency base class.
- SSR-safe `StyleSheet` abstraction.
- DSD-native `@lessjs/ui` ocean components.
- CSS Parts and Open Props token migration.
- Lit retained only for island/compatibility paths.
- DSD report gate with finite thresholds.
- SOP-014 cleanup gate hardening.
- ADR-0037 + SOP-015 strategic docs alignment.

## Next Planned Line: v0.22.x

Primary goals:

1. Runtime adapter ISR integration.
2. Signals-backed DsdElement rendering helpers.
3. Hub author onboarding and package-count growth.
4. Broader third-party WC compatibility evidence.

## Current Verification Baseline

Recent v0.21 implementation verification recorded:

- `deno task fmt:check` - passed
- `deno task lint` - passed
- `deno task typecheck` - passed
- `deno task test` - passed, 743 tests
- `deno task build` - passed
- `deno audit` - passed
- `deno task dsd:check-report` - passed with finite baseline
- `deno task test:e2e` - passed, 92 tests
- `deno task hub:validate --strict --json` - passed
- `deno task hub:check-index` - passed

Re-run gates before making release claims. Treat this section as the latest
recorded baseline, not a substitute for live verification.

## Known Issues

- DSD build reports still contain known third-party SSR failures. They are
  classified and gated, not eliminated.
- Hub package count is too small for marketplace claims.
- Public package versions are not synchronized across the workspace.
- UI, app, i18n, create, and some adapters need more targeted test coverage.
- Large files remain refactor candidates:
  - `packages/core/src/types.ts`
  - `packages/ui/src/less-layout.ts`
  - `packages/adapter-vite/src/index.ts`
  - `www/app/routes/index/index.ts`
  - `www/app/routes/changelog.ts`

## Active Rule

Third-party package handling is conservative:

- explicit supported SSR metadata -> SSR/SSG
- `ssr: false` or unknown CEM-only package -> client-only
- invalid metadata, duplicate tags, unsafe paths -> rejected before build
- DOM simulation -> experimental opt-in only

## Version Ladder With Admission And Exit Gates

| Version | SOP                                                    | Status  | Exit Gate                                                                  |
| ------- | ------------------------------------------------------ | ------- | -------------------------------------------------------------------------- |
| v0.17.3 | `docs/sop/v0.17.3-multi-framework-adapters.md`         | Done    | Vanilla/React adapters documented; no universal SSR claim                  |
| v0.17.4 | `docs/sop/v0.17.4-compatibility-boundary-hardening.md` | Done    | Client-only modules excluded before SSR entry generation                   |
| v0.18.0 | `docs/sop/v0.18.0-universal-wc-engine.md`              | Done    | CEM parser + compatibility tiers + report reasons                          |
| v0.18.1 | `docs/sop/v0.18.1-validate-manifest-cli.md`            | Done    | `less validate-manifest` emits stable diagnostics                          |
| v0.18.2 | `docs/sop/v0.18.2-less-add-install-flow.md`            | Done    | `less add` dry-run/install is validation-gated                             |
| v0.18.3 | `docs/sop/v0.18.3-dom-simulation-experiment.md`        | Done    | opt-in DOM simulation decision recorded                                    |
| v0.19.0 | `docs/sop/v0.19.0-platform-hub.md`                     | Done    | Hub ingests artifacts, CLI submit, component browser, Playwright snapshots |
| v0.20.0 | `docs/sop/v0.20.0/`                                    | Done    | Ocean-Island migration, cleanup gate, public docs alignment                |
| v0.21.0 | `docs/sop/v0.21.0/`                                    | Current | hydration strategies + ISR + API route parity                              |
| v1.0.0  | `docs/sop/v1.0.0-general-purpose-engine.md`            | Vision  | stable contracts and deterministic package outcomes                        |

## Operator Checklist

Before starting or continuing a version:

1. Read this STATUS file.
2. Read the target version SOP.
3. Read linked ADRs.
4. Confirm entry criteria are true.
5. Implement only the target SOP scope.
6. Run verification commands listed in the SOP.
7. Update changelog, status, roadmap, and website docs only after evidence
   matches the new claims.

## JSR Publish Order

1. `@lessjs/rpc`
2. `@lessjs/signals`
3. `@lessjs/core`
4. `@lessjs/adapter-vite`
5. `@lessjs/content`
6. `@lessjs/i18n`
7. `@lessjs/adapter-lit`
8. `@lessjs/adapter-vanilla`
9. `@lessjs/adapter-react`
10. `@lessjs/ui`
11. `@lessjs/app`
12. `@lessjs/create`
13. `@lessjs/hub`

## Historical Reviews

Archived in [docs/status/reviews/](./reviews/) and organized by date.
