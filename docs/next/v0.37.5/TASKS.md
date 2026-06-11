# v0.37.5 Tasks

## A. Product and Governance Repositioning

- [x] Accept ADR-0096 as the governing architecture decision.
- [x] Update status and roadmap language from "DSD-first framework" to
      "Web Components application framework powered by Vite + Nitro."
- [x] Record v0.37.4 JSR publish state as best-effort distribution telemetry
      under ADR-0097 before v0.37.5 implementation starts.
- [x] Update SOP and NextVersion package to make protocol-first runtime work
      the active v0.37.5 scope.

## B. Protocol Inventory

- [x] Inventory current protocol-like types in `core`, `app`, `ssg`, `signals`,
      and `adapter-vite`.
- [x] Identify which imports are public and require backward-compatible
      re-exports.
- [x] Define the first accepted protocol groups under `@openelement/protocols`.
- [x] Add package export paths for protocol groups without introducing cycles.

## C. Protocol Migration

- [x] Move or re-export `RendererProtocol`-related types.
- [x] Move or re-export `IslandConfig` and `HydrationStrategy`.
- [x] Move or re-export signal interoperability types.
- [x] Move or re-export `DataAdapter`.
- [x] Write the EntryDescriptor / route manifest ADR.
- [x] Move or mirror route manifest contracts into `@openelement/protocols`.

## D. Conformance Tests

- [x] Add `runRendererConformance(impl)`.
- [x] Add a component adapter conformance skeleton.
- [x] Add a runtime adapter conformance skeleton using fetch-compatible
      request/response.
- [x] Add cache adapter conformance checks for get/set/delete behavior.
- [x] Run the renderer conformance suite against the current core renderer.

## E. Nitro Proof Plan

- [x] Document the universal request handler shape.
- [x] Document the Nitro server-handler mapping.
- [x] Document asset and island chunk mapping.
- [x] Document ISR/cache mapping risks.
- [x] Create v0.37.6 proof tasks for Node and Cloudflare Workers output.

## F. UI Coverage Rebase

- [x] Preserve the v0.37.4 CSS foundation baseline.
- [x] Move daisyUI interactive/form coverage to the next UI product slice after
      protocol/runtime proof.
- [x] Keep no-Tailwind and no-new-dependency constraints.
