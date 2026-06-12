# openElement Project Status

> AI assistant: read this file first on every session start.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`. Active execution
package: `docs/next/v0.39.0/` (Framework RC + Four-Product Matrix Reset).

## Current Version Line: v0.39.0 (Framework RC + Four-Product Matrix Reset)

v0.39.0 is the active release-candidate framework line and product-matrix
reset. Its job is to prove that the v0.38 product map works as a generated,
deployable, consumer-verified openElement app while ADR-0099 resets the public
target to `openElement = Elements + UI + Framework + Protocols`. The active SOP
is `docs/sop/v0.39.0/README.md`; the active NextVersion package is
`docs/next/v0.39.0/`.

v0.39.0 now owns package version `0.39.0` after local implementation gates
passed. ADR-0100 restores JSR publish as a release exit gate for v0.39+
closure.

The local v0.39.0 RC proof now validates generated starter behavior from
`@openelement/create`, proves pages/layouts/islands/API routes/static output,
assets, SSR/ISR intent, and Nitro runtime behavior through `consumer:local`,
aligns docs/templates with the four-product matrix, adds public README
integrity gates, excludes Web Awesome from the current target, and records Vue
as the only heavy-framework island adapter proof. The package bump to `0.39.0`
is complete, post-bump local gates passed, `dev` and `main` CI passed, JSR
publish evidence passed in `Publish to JSR` run `27425438225`, and package
test CI coverage is guarded by `deno task ci:check-package-tests`. Core signal
protocol types now resolve through `@openelement/protocols/signals`, guarded by
`deno task signals:check-protocol-boundary`.

## Prior Version Line: v0.38.0 (Product Surface Reset)

v0.38.0 is released. Tag `v0.38.0` and the GitHub release exist at commit
`e729bee4`. All 20 `@openelement/*` workspace packages are aligned to
`0.38.0`. Local implementation and post-bump release gates passed; `dev` and
`main` non-JSR CI passed before tag/release. Local JSR publish evidence ran
after release and confirmed all 20 package versions already existed on JSR, so
the publish task skipped immutable versions successfully.

v0.38.0 turned the v0.37.x protocol and Nitro evidence into a documented public
product/package surface. It recorded a package/subpath inventory,
product-surface classification, and product map under `docs/next/v0.38.0/`.
The product map retains existing package names, classifies Hub as archived for
the v1 public product map, and moves internal build/tooling packages out of
first-run documentation. Root README, README.zh,
`docs/arch/current-architecture.md`, package READMEs, website guide/API pages,
and `@openelement/create` templates now separate product, advanced, internal,
and archived surfaces. Migration notes record the starter import-map change,
archived RPC status, and internal SSG status.

## Prior Version Line: v0.37.6 (Vite + Nitro Runtime Proof)

v0.37.6 is released. Tag `v0.37.6` and the GitHub release exist at commit
`19d77dee`. All 20 `@openelement/*` workspace packages are aligned to
`0.37.6`. The implementation exposes the openElement universal request handler
from the generated route pipeline, keeps the Nitro boundary in
`@openelement/adapter-vite`, and proves that boundary through a real Nitro
fixture under `fixtures/nitro-proof/`.

Local evidence: `deno task nitro:proof:node` builds Nitro `node-server` output
and verifies the mounted openElement Web `Response`, public asset serving,
route/render behavior, explicit island minimality, static zero-JS output, API
routes, and Nitro-owned cache-control for `/isr`. `deno task
nitro:proof:workers` builds Nitro `cloudflare-module` output and verifies the
generated Workers server entry, wrangler config, public asset, openElement
route/render markers, and route-rule cache markers. Local, `dev`, and `main`
non-JSR release gates passed. JSR publish ran locally and in CI under the
ADR-0097-era distribution policy.

## Prior Version Line: v0.37.5 (Protocol-First Runtime Architecture)

v0.37.5 is released. Tag `v0.37.5` and the GitHub release exist at commit
`e1016ec0`. All 20 `@openelement/*` workspace packages are aligned to
`0.37.5`, `ACTIVE_VERSION` points at `v0.37.5`, and local release gates passed
for workflow, graph, architecture, docs, format, lint, typecheck, test, build,
and publish dry-run. v0.37.5 establishes `@openelement/protocols` as the
replacement boundary for renderer, component, runtime, route, island, cache,
signal, and data contracts while positioning Vite + Nitro as the default base
engine for the v0.37.6 runtime proof.

ADR-0097 changed the release policy for that historical line: JSR package
visibility was no longer a version-exit gate, and registry health became a
release-note caveat.

## Prior Version Line: v0.37.4 (Hygiene + Pure CSS UI + Architecture Decoupling) - JSR Distribution Caveat

v0.37.4 implementation is complete. All 20 `@openelement/*` workspace packages
were aligned to `0.37.4`, tag `v0.37.4` exists, and the GitHub release exists.

Live registry state on 2026-06-11: `@openelement/rpc`,
`@openelement/protocols`, and `@openelement/router` are visible on JSR at
`0.37.4`; publish recovery has progressed to 15/20 packages. The first recovery
patch failed because a 5-minute per-package timeout interrupted
`@openelement/style-sheet` before JSR accepted the immutable version; the next
attempt proved the 20-minute window still fails for slower packages such as
`@openelement/content`. The current recovery patch uses a 45-minute package
window, keeps provenance enabled, polls live JSR version metadata during
`deno publish`, stops the hung publish process after the immutable version
becomes visible, extends the publish job to 360 minutes for the recovery path,
and makes post-publish consumer smoke wait for package-level `meta.json`
propagation before invoking a fresh `jsr:@openelement/create@0.37.4` consumer.

Follow-up registry check on 2026-06-12 with
`deno info --no-config jsr:@openelement/<pkg>@0.37.4` only resolved `rpc`,
`protocols`, `router`, `runtime`, and `cem`; key dependencies such as
`style-sheet`, `signals`, and `core` still failed package-level resolver
visibility. Treat 2026-06-11 registry counts as a historical recovery snapshot,
not release closure.

v0.37.4 delivered the 2026-06-10 audit hygiene fixes, ADR-0094 Core Type
Consolidation, adapter-vite deprecated shell removal, SSG ownership cleanup,
dsd-hydration helper deduplication, UI/router decoupling, a daisyUI-inspired
pure CSS foundation, three DsdElement interactive thin-shell proofs
(`open-dropdown`, `open-modal`, `open-tabs`), and test supplementation. Local
evidence recorded for the release: 1600 tests passed before publish recovery.

v0.37.3 (Data / Database Boundary) is done as a validation-train stop:
ADR-0095 accepted and implemented with MemoryDataAdapter baseline,
FileDataAdapter deferred to recipe, and the 2026-06-10 JSR publish hotfix
closed for the prior package line. v0.37.4 JSR distribution remains externally
unhealthy, but ADR-0097 prevents that external state from blocking roadmap
execution.

The active implementation line is now v0.39.0. It proceeds from v0.38.0 product
surface evidence while restoring JSR publish evidence as a release exit gate
under ADR-0100.

Governing docs:

- `docs/sop/v0.39.0/README.md`
- `docs/next/v0.39.0/`
- `docs/sop/v0.38.0/README.md`
- `docs/next/v0.38.0/`
- `docs/sop/v0.37.6/README.md`
- `docs/next/v0.37.6/`
- `docs/sop/v0.37.5/README.md`
- `docs/next/v0.37.5/`
- `docs/adr/ADR-0096-protocol-first-vite-nitro-runtime.md`
- `docs/adr/ADR-0097-jsr-best-effort-release-gate.md`
- `docs/adr/ADR-0098-entry-descriptor-route-manifest-contract.md`
- `docs/adr/ADR-0099-four-product-matrix-and-elements-reset.md`
- `docs/adr/ADR-0100-jsr-publish-exit-gate-restored.md`
- `docs/sop/v0.37.4/README.md`
- `docs/next/v0.37.4/`
- `docs/sop/v0.37.3/README.md`
- `docs/next/v0.37.3/`
- `docs/adr/ADR-0095-data-database-boundary.md`
- `docs/sop/v0.37.4/README.md`
- `docs/next/v0.37.4/`
- `docs/adr/ADR-0093-ssr-isr-runtime-contract.md`
- `docs/sop/v0.37.1/README.md`
- `docs/next/v0.37.1/`
- `docs/adr/ADR-0092-dsdelement-render-mode.md`
- `docs/sop/v0.37.0/README.md`
- `docs/next/v0.37.0/`
- `docs/adr/ADR-0091-four-product-platform-roadmap.md`
- `docs/sop/v0.36.5/README.md`
- `docs/next/v0.36.5/`
- `docs/sop/v0.36.4/README.md`
- `docs/next/v0.36.4/`
- `docs/roadmap/ROADMAP.md`
- `docs/governance/BRANCHING.md`

v0.36.4 Status: **IMPLEMENTED.** It closed the Firefox/WebKit cross-browser
proof line, documented remaining browser-specific limitations, added the
cross-browser E2E gate, and bumped all 20 packages to 0.36.4.

v0.36.5 Status: **IMPLEMENTED.** It closed release-truth and AutoFlow drift
without product-code changes or package version bumps.

v0.37.0 Status: **IMPLEMENTED.** It reset the roadmap, SOP, ADR, NextVersion,
status, and website truth around the four-product validation train without
product-code changes.

v0.36.3 Status: **IMPLEMENTED.** It completed SSG file ownership migration so
`@openelement/ssg` owns route scanning, entry generation, generated data
resolution, SSG Vite plugin logic, render, and postprocess code. `adapter-vite`
is now Vite build orchestration glue.

v0.36.2 Status: **IMPLEMENTED.** It moved Vite-free SSG render and HTML
postprocess helpers into `@openelement/ssg`, while keeping adapter-vite as the
Vite shell for the remaining bridge work.

v0.36.1 Status: **IMPLEMENTED.** It closed the v0.36 release truth and AutoFlow
evidence gap with `cell-v0.36.1-001`, non-zero metrics, Windows-safe generated
test paths, and aligned v0.36.0 deferrals.

v0.36.0 Status: **IMPLEMENTED WITH DEFERRED ITEMS.** Delivered signals docs,
deployment docs, version sync, error-boundary retry/degraded fallback coverage,
FileIsrCache, `@openelement/ssg` Phase 1, parallel SSG evidence, and AutoFlow
built-in cell generation.

## Next Targets

| Version | Theme                                              | Status                      | Purpose                                                                                                        |
| ------- | -------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| v0.31.0 | JSX-first Application API                          | Done                        | App authoring API, `/vite` config split, docs/template DX                                                      |
| v0.32.0 | App Lifecycle Contract                             | Done                        | Route, load, context, layout, error, redirect lifecycle                                                        |
| v0.33.0 | AI-Readable API Foundation                         | Done                        | Structured page, island, head, route, and render intent APIs                                                   |
| v0.34.0 | AutoFlow2 Sidecar Kernel                           | Done                        | Workflow state, cells, evidence ledger, allowed-action report                                                  |
| v0.35.x | AutoFlow2 Mechanical Autonomy                      | Done                        | Harness Gate, Cell Execution, Evolution Loop, and full-auto evidence                                           |
| v0.36.0 | Rendering Runtime, Deployment & Deferred Refactors | Done with deferrals         | Rendering/runtime evidence and Phase 1 SSG extraction                                                          |
| v0.36.1 | AutoFlow Closure & v0.36 Release Truth             | Done                        | AutoFlow proof and release truth alignment                                                                     |
| v0.36.2 | SSG Bridge Migration + Rendering Evidence Closure  | Done                        | Move Vite-free SSG core into `@openelement/ssg` and close ISR/SSR/stream evidence                              |
| v0.36.3 | Complete SSG File Ownership Migration              | Done                        | Move route scanner, entry generator, Vite plugin, generated data resolver out of adapter-vite                  |
| v0.36.4 | Firefox/WebKit Cross-Browser Proof                 | Done                        | Resolve Firefox/WebKit E2E timeout and behavior differences                                                    |
| v0.36.5 | Release Truth and AutoFlow Closure                 | Done                        | Align workflow, release docs, AutoFlow evidence, and website truth                                             |
| v0.37.0 | Product Doctrine + Rendering Contract Reset        | Done                        | ADR-0091, default 0JS doctrine, DSD/shadow default, light opt-in terms, v0.37.x SOP split                      |
| v0.37.1 | DsdElement Shadow + Light Contract                 | Done                        | Explicit `DsdElement.renderMode = 'light'` opt-in with SSR/CSR proof                                           |
| v0.37.2 | SSR / ISR Server Runtime Contract                  | Done                        | Request-time SSR/ISR runtime boundary, cache contract, server adapter evidence                                 |
| v0.37.3 | Data / Database Boundary                           | Done                        | Data/database adapter contracts and recipes without built-in ORM ownership                                     |
| v0.37.4 | Hygiene + Pure CSS UI + Architecture Decoupling    | Done / JSR caveat           | Implementation complete; JSR distribution followed ADR-0097-era caveats                                        |
| v0.37.5 | Protocol-First Runtime Architecture                | Done                        | Make `@openelement/protocols` the real replacement boundary and define Vite + Nitro as the default base engine |
| v0.37.6 | Vite + Nitro Runtime Proof                         | Done                        | Prove openElement routes, rendering, islands, assets, SSR/ISR intent, and deployment output through Nitro      |
| v0.38.0 | Product Surface Reset and Hardening                | Done                        | Reset public package/API/product surface based on protocol and Nitro runtime evidence                          |
| v0.39.0 | Framework RC + Four-Product Matrix Reset           | Active / local gates passed | ADR-0099, public docs integrity, Elements direction, Vue adapter plan, starter/deploy/consumer gates           |
| v1.0.0  | Stable Four-Product Platform                       | Vision                      | API freeze for Elements, UI, Framework, and Protocols with workflow evidence in release gates                  |

## Current Product Center

> openElement = Elements + UI + Framework + Protocols.

ADR-0099 defines the current product matrix:

| Product   | Current/future primary surface                | Status                                         |
| --------- | --------------------------------------------- | ---------------------------------------------- |
| Elements  | future `@openelement/elements`, `OpenElement` | Product direction; implementation follow-up    |
| UI        | `@openelement/ui`                             | First-party `open-*` component library         |
| Framework | `@openelement/app`, `@openelement/create`     | Active v0.39 RC proof                          |
| Protocols | `@openelement/protocols`                      | Replacement boundary and conformance contracts |

Historical positioning note: earlier ADRs used the phrase DSD-first to protect
shadow/DSD output as the default. ADR-0096 refines that into Web Components
application framework identity, with shadow/DSD as the default render mode and
light DOM as first-class opt-in. ADR-0099 further refines the product matrix:
DSD/shadow is a default Elements render mode, not the product name.

## Current Rendering Mode

| Mode                 | State       | Notes                                                                                        |
| -------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| SSG                  | shipped     | default production rendering; Vite-free core now lives in `@openelement/ssg`                 |
| DSD                  | shipped     | `renderDsd()` outputs declarative shadow roots                                               |
| Streaming DSD        | evidence    | `renderDsdStream()` is tested through Web `Response` consumption; not default server runtime |
| Static zero-JS       | doctrine    | static routes emit no framework JS unless islands, hydration, or client-only are explicit    |
| JSX+Signal           | shipped     | `render(): VNode \| null`, effect() signal tracking                                          |
| Island upgrade       | shipped     | binary SSR/client-only boundary                                                              |
| Hydration strategies | shipped     | `client:load/idle/visible/only`                                                              |
| ISR contract         | shipped     | `IsrCache`, caches, manifest entries, and `@openelement/core/isr-runtime` response flow      |
| API route (Hono)     | shipped     | Hono is the current API route/request handler layer                                          |
| Runtime engine       | planned     | Nitro is the default production runtime/deployment target after v0.37.6 proof                |
| AppShell protocol    | shipped     | default, bare, custom, and route-selected shells                                             |
| Application API      | v0.31.0     | `definePage`, `defineIsland`, `/vite` config split                                           |
| App lifecycle        | v0.32.0     | load context, route meta, redirect, not-found, error                                         |
| AI-Readable API      | v0.33.0     | Object-form pages, island config, head trust boundary                                        |
| AutoFlow2            | v0.34-v0.36 | report/check/evolve sidecar with evidence ledger and release truth gates                     |

## Package Version State

All 20 workspace packages are aligned to **0.39.0** under `@openelement/*`.
The active execution package is **v0.39.0**.

Package governance for v0.39:

- do not add a new top-level package without an ADR;
- ADR-0099 approves future `@openelement/elements` and Vue adapter work, but
  implementation must update package count, release order, import maps, graph
  checks, docs, and migration notes;
- keep protocol contracts small and runtime-free;
- keep UI independent from framework routing;
- keep database, ORM, auth, backend, runtime, cache, storage, and deployment
  choices at protocol, adapter, or recipe boundaries.

## Architecture Positioning

1. **Elements** - native Web Components authoring with JSX, signals, styles,
   shadow/DSD defaults, explicit light DOM opt-in, and the future
   `OpenElement` base class.
2. **UI** - first-party `open-*` components built on the Elements model and
   independent from framework routing.
3. **Framework** - `definePage()`, `defineIsland()`, file routes, layouts,
   `load()`, error/redirect/not-found behavior, SSG/SSR/ISR, API routes, and
   starter/create workflows.
4. **Protocols** - runtime-free contracts for renderer, component adapter,
   route manifest, island metadata, runtime adapter, cache/storage, data, and
   signal interoperability.
5. **Default engine bridge** - Vite owns module graph, plugin orchestration,
   client bundling, and HMR; Nitro owns production runtime, deployment output,
   platform presets, cache/storage, and route-rule plumbing.
6. **Supporting packages** - runtime/core, adapters, SSG, router, content, i18n,
   signals, and style-sheet support the four products without becoming product
   lines.

## Future Product Direction

- ADR-0099 supersedes the v0.38 package-name deferral for future work and
  approves the four-product matrix.
- Elements becomes a first-class product direction, with `OpenElement` replacing
  `DsdElement` terminology in future public APIs.
- Web Components remain the default component model, but renderer and component
  adapter protocols must not assume only one frontend framework.
- Shadow/DSD remains the default Elements render mode; explicit light DOM opt-in
  is a first-class supported mode.
- Vite + Nitro are the default base engine. Vite handles build/module graph and
  Nitro handles production runtime/deployment, but neither should leak as the
  primary user-facing application API.
- Protocols should grow through concrete conformance tests, not broad
  abstraction rewrites.
- UI remains first-party and Elements-based. Web Awesome is not part of the
  current target.
- Heavy-framework island expansion is limited to a Vue adapter proof in the
  current plan.
- Database work belongs in data/database adapter contracts and recipes. It must
  not become a built-in ORM, auth platform, or migration system.
- A Vite + Nitro runtime proof should compose openElement routes, rendering,
  islands, assets, API routes, and ISR/cache intent before product-surface reset.
- Governance convergence before v1.0: gate tiers (fast dev gate for PRs,
  full release gate for publishing), AutoFlow feature scope freeze, Hub scope
  deferred to post-v1.0. See `docs/roadmap/ROADMAP.md` v0.38.x for details.
- JSR publish is a v0.39+ release exit gate under ADR-0100. Release notes must
  not claim closure unless publish evidence or an ADR-approved exception exists.

## Key Decisions

- **Four-product matrix.** openElement is Elements + UI + Framework +
  Protocols; supporting packages do not become first-class products by
  existing in the workspace.
- **Elements product reset.** Future public element authoring centers on
  `@openelement/elements` and `OpenElement`, not `DsdElement` terminology.
- **Application API first.** App authors write `definePage()` and
  `defineIsland()` before touching lower-level Elements APIs.
- **Vite config split.** `openElement()` is imported from
  `@openelement/app/vite`.
- **Vite + Nitro default engine.** Vite is the default build/module graph
  engine and Nitro is the planned default production runtime/deployment engine.
- **Protocol-first replacement boundary.** Renderer, component adapter, runtime,
  route manifest, island, cache/storage, signal, and data contracts belong in
  `@openelement/protocols` with conformance tests.
- **TemplateResult and string render removed.** JSX+Signal is the only component
  model. `render()` returns `VNode | null`.
- **Web Components product identity.** openElement is a Web Components
  application framework; DSD/shadow is the default render mode, not the entire
  product identity.
- **Static default 0JS.** Static routes should emit zero framework JavaScript
  unless islands, hydration, or client-only components are explicit.
- **SSR/ISR in framework core.** SSR and ISR belong to the framework product
  line and are not split into a fifth product.
- **Light DOM is opt-in.** Shadow/DSD remains the default Elements render mode.
  Light DOM support requires explicit API, tests, docs, and ADR coverage.
- **Current heavy island target.** Vue is the only planned heavy-framework
  island adapter proof for v0.39; React is not expanded and Web Awesome is out
  of scope.
- **No DOM diff.** Signal writes trigger scoped rerender behavior; complex
  subtrees stay in Islands.
- **Package graph gate.** `graph:check` verifies zero cycles, unified versions,
  and declared imports.
- **JSR publish exit gate restored.** `publish:dry-run` remains a local release
  gate, and live or CI JSR publish evidence is required for v0.39+ version
  closure. See ADR-0100.
- **SSG ownership.** `@openelement/ssg` owns SSG render, postprocess, route
  scanning, entry generation, generated data resolution, and SSG-specific Vite
  plugin logic.
- **AutoFlow2 boundary.** AutoFlow2 may report state, evidence, blockers, and
  allowed actions. It must not merge, tag, bump, publish, or replace human review
  for ADRs, public API resets, package removal, release tags, or publishing.
- **Protocol first-class.** Core rendering, adapter, island/hydration, signal,
  data, route-manifest, runtime, cache, storage, and component-adapter contracts
  live in `@openelement/protocols` with conformance tests.

## Release Gate Order

```bash
deno task workflow:check
deno task docs:check-public
deno task arch:check
deno task graph:check
deno task ci:check-package-tests
deno task signals:check-protocol-boundary
deno task docs:check-current
deno task docs:check-strategy
deno task fmt:check
deno task lint
deno task typecheck
deno task autoflow:test
deno task autoflow:health
deno task autoflow:check
deno task test
deno task build
deno task dsd:check-report
deno task publish:dry-run
deno task test:e2e
```

Live JSR publish and post-publish JSR consumer smoke run after
repository-controlled gates, dev/main CI, merge, and tag/release work. For
v0.39+ release closure, JSR publish evidence is required unless a later ADR
approves an explicit exception.
