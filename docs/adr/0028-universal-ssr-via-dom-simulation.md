# ADR-0028: Conservative Third-Party WC SSR Admission

- Status: Proposed
- Date: 2026-05-16
- Target: v0.17.3 -> v1.0 admission model

## Context

LessJS is moving from a framework-specific renderer into a Web Components
SSR/SSG engine and, later, a registry Hub. The recent v0.17.3 work proves that
multiple adapter families can exist: Lit, vanilla string renderers, and
React-to-Web-Component wrappers.

That does not mean every third-party Web Component library can be server
rendered safely.

Real-world WC libraries often depend on browser-only APIs during construction,
`connectedCallback()`, render, or controller setup. Examples include:

- reading `childNodes`, `querySelector`, slot state, layout, or focus state
- creating and appending real DOM nodes
- expecting browser event loops, observers, media APIs, or form internals
- relying on package-level side effects during import

The v0.17.3 compatibility investigation exposed exactly this boundary:
components from libraries such as Shoelace can be registered into the SSR
environment, but their render path can fail when the current SSR host object is
not a full browser DOM node. Treating that as "just a bug" would lead the
roadmap to overpromise.

## Decision

LessJS will use a conservative admission model for third-party Web Components.

The project will not claim that arbitrary Web Components, arbitrary CEM
manifests, or arbitrary npm packages get automatic SSR.

Instead, every package/component gets one deterministic outcome:

1. **SSR-capable**: render through a declared LessJS adapter or an explicit
   Less runtime extension that has passed validation.
2. **Client-only**: skip SSR and emit hydration/registration metadata when the
   package is browser-dependent or has no SSR declaration.
3. **Rejected before build**: fail validation when metadata is malformed,
   unsafe, ambiguous, or conflicts with other packages.
4. **Experimental DOM simulation**: optionally attempt rendering in a simulated
   DOM only behind an explicit flag and only after validation marks the package
   as eligible.

### Admission Rules

| Input package state                                                | Default outcome                                 | Reason                                   |
| ------------------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------- |
| Less manifest declares `ssr: true` and adapter/capability is known | SSR/SSG                                         | Explicit contract exists                 |
| Less manifest declares `ssr: false`                                | Client-only                                     | Runtime dependency is declared           |
| CEM exists but no Less SSR extension exists                        | Client-only                                     | CEM describes elements, not SSR safety   |
| No CEM and no Less manifest                                        | Rejected or manual config required              | No reliable package contract             |
| Duplicate tag names                                                | Rejected unless scoped registry support applies | Avoid global registry collision          |
| Package import has unsafe side effects                             | Rejected or sandboxed later                     | Supply-chain and build integrity risk    |
| DOM simulation requested                                           | Experimental opt-in                             | Useful research, not a default guarantee |

### DOM Simulation Position

DOM simulation may become a v0.18 research/prototype track, but it is not a
v0.17.3 fix and not a v1.0 guarantee by itself.

If implemented, it must be:

- opt-in at package or component level
- timeout-bound
- isolated per render job or per page with cleanup
- reported in `dsd-report.json`
- disabled by default for unknown third-party packages
- treated as a compatibility strategy, not proof of browser-equivalent behavior

## Consequences

### Positive

- The roadmap becomes honest: "automatic" means protocol-driven, not magical.
- Third-party libraries that are not SSR-safe still work through deterministic
  client-only fallback.
- The future Hub can rank packages by verified compatibility instead of
  trusting README claims.
- Build failures become actionable validation errors rather than late SSR stack
  traces.

### Negative

- LessJS cannot market "any WC package gets SSR" as a blanket claim.
- Some popular UI libraries will initially show as client-only until they add a
  Less extension, compatible adapter, or pass an experimental DOM simulation
  gate.
- v0.18 needs more validation and reporting work before broad package support
  is credible.

### Neutral

- CEM remains important, but CEM is metadata for custom elements. It is not an
  SSR contract.
- `less.ssr: false` is a first-class compatibility declaration, not a failure.
- The Hub starts as a validated registry index before becoming a marketplace.

## Version Admission Ladder

| Version | Admission gate                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| v0.17.3 | Multi-adapter support, explicit client-only fallback, no blanket third-party SSR claim                     |
| v0.17.4 | Local island metadata must control SSR import/registration decisions before SSR bundle generation          |
| v0.18.0 | CEM parser + compatibility tiers + conservative fallback by default                                        |
| v0.18.1 | `less validate-manifest` with actionable diagnostics and compatibility score                               |
| v0.18.2 | `less add` dry-run/install flow only for packages that pass validation                                     |
| v0.18.x | Optional DOM simulation prototype behind explicit opt-in                                                   |
| v0.19.0 | Hub MVP consumes validation/build artifacts; no unverified package execution                               |
| v1.0    | Stable API and deterministic outcomes for compatible packages, client-only packages, and rejected packages |

## Relation to Existing ADRs

- ADR-0025 (Renderer Protocol): third-party SSR requires a renderer capability,
  not just a registered custom element.
- ADR-0026 (Structured Render Pipeline): all admission decisions must surface in
  structured diagnostics and `dsd-report.json`.
- ADR-0027 (Roadmap Reorder): engine and protocol quality remain prerequisites
  for the Hub.

## Non-Goals

- No promise that every CEM package can SSR.
- No default execution of arbitrary npm package code during validation.
- No public Hub marketplace before local validation, reports, and security
  boundaries are stable.
- No use of DOM simulation as an invisible fallback that changes build output
  without reporting.
