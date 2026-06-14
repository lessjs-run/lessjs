# ADR-0094: Core Type Consolidation — Eliminate `types.ts`

Status: Proposed

Date: 2026-06-10

## Context

`packages/core/src/types.ts` has historically been the single source for all
framework types — public API contracts, render pipeline internals, CEM schema
types, diagnostic structures, and constructor signatures — all stacked into one
file. After ADR-0093's ISR runtime contract was added in v0.37.2, the file
exceeded 1,500 lines.

v0.37.3 clean-types already completed a partial cleanup:

- 403 lines of CEM schema types removed (duplicated in `@openelement/cem`).
- `DsdRenderCollector` runtime class extracted to `dsd-collector.ts`.
- `DsdComponentConstructor` moved to `dsd-element.ts`.
- `classMap`/`when`/`repeat` legacy APIs fully removed across all packages.
- Zero `any` type usages in core source files (constructor `any[]` mixin
  signatures remain, per TypeScript convention).

Result: **1,506 → 1,154 lines (-23%)**.

The remaining 1,154 lines still mix three categories: public API schemas,
render-pipeline internals, and compatibility/diagnostic types. The file is still
an unstructured barrel.

## Decision

Eliminate `types.ts` by consolidating types into ~~three~~ two files with clear
semantic boundaries:

1. **`core/src/schemas.ts`** — Public API contract types consumed by external
   packages and users. These types define the framework's user-facing shape.

   - `FrameworkOptions`, `AppShellConfig`, `AppShellDefinition`,
     `LayoutsConfig`.
   - `RouteEntry`, `SsrContext`, `SpecialFileType`.
   - `OpenElementMiddleware`, `OpenElementMiddlewareContext`,
     `OpenElementRenderer`.
   - `OpenElementApiContext`.
   - `OpenElementAttribute`, `OpenElementMember`, `OpenElementDeclaration`,
     `OpenElementModule`, `OpenElementEvent`, `OpenElementSlot`,
     `OpenElementCssProperty`, `OpenElementCssPart`, `OpenElementExport`,
     `OpenElementExtensions`, `OpenElementPackageExtensions`,
     `OpenElementPackageManifest`.
   - `ReactiveHost`, `Unsubscribe`.

2. **Render pipeline types** — Move into their consuming modules within
   `core/src/`:

   | Type(s)                                                                                                                                                                                                                                                                                                      | Destination                 |
   | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
   | `ComponentLayer`, `HydrationHint`, `HydrationStrategy`, `StrategySource`, `HydrateEventDescriptor`                                                                                                                                                                                                           | `dsd-hydration-events.ts`   |
   | `DsdComponent`, `DsdOptions`, `RenderInput`, `RenderOutput`, `RenderHooks`, `RenderPhase`, `RenderError`, `DsdRenderMetrics`, `DsdReport`, `DsdBuildReport`, `DsdHydrationHintSummary`, `DsdHydrationStrategySummary`, `DsdMetricsSummary`, `DsdPageDiagnostics`, `ManifestDecision`, `SsrAdmissionDecision` | `render-dsd.ts`             |
   | `CemCompatibilityReport`, `CompatibilityClassification`, `CompatibilityTier`, `DomSimulationReport`, `DomSimulationAttempt`, `ValidationDiagnostic`, `ValidatedTag`, `ValidationError`, `ValidationResult`, `ValidationWarning`, `ManifestValidationReport`                                                  | `compat-schemas.ts` (new)   |
   | `RegistryIndex`, `RegistryIndexEntry`, `RendererProtocol`, `SsrErrorContext`                                                                                                                                                                                                                                 | `registry.ts` / `errors.ts` |
   | `IsrRouteRecord`                                                                                                                                                                                                                                                                                             | `isr-runtime.ts`            |

3. Remove `types.ts` and update `index.ts` re-exports to point at the new
   locations.

4. Remove the `"./types"` subpath from `packages/core/deno.json` (audit shows
   zero external consumers of this subpath).

**Explicit non-goals:**

- No type shape changes. Every type keeps its current name and structure.
- No public API breakage. All re-exports in `index.ts` continue to resolve.
- No behavioral changes. This is a file organization change only.
- No changes to `@openelement/cem` or `@openelement/protocol`.

## Consequences

### Positive

- **Lower cognitive load.** Search "FrameworkOptions" → go to `schemas.ts`.
  Search "DsdComponent" → go to `render-dsd.ts`. No more scrolling through
  unrelated types to find what you need.
- **Better module isolation.** Adding a render pipeline type no longer
  requires touching the centralized type barrel. This reduces merge conflicts
  in `types.ts` — the most frequently touched file in the repo.
- **Natural deletion of low-value types.** Types used by only one module can
  become `interface` exports of that module, not global exports of `schemas.ts`.
- **Precedent for v0.38.** The Product Surface Reset will need clear type
  ownership. This ADR establishes the pattern: public contracts in `schemas`,
  implementation types in the modules they serve.

### Neutral

- `index.ts` re-export lines increase from ~70 to ~80 to cover the additional
  source modules. The consumer-facing import experience is unchanged.
- Some types (e.g. `HydrationHint`) are imported by both `render-dsd.ts` and
  `dsd-hydration-events.ts`. The type lives in the module that produces it;
  consumers import from there.

### Negative

- A developer new to the codebase cannot find "all types" in one file. They
  must either know the domain (render → `render-dsd.ts`, config → `schemas.ts`)
  or grep.
- Migration touches ~50 files across 15+ packages. This is a one-time cost.

## Rollback

If this decision causes unforeseen complexity, rollback is a single `git reset
--hard` command. No permanent changes to the public API surface.

## Related

- ADR-0091: Four-Product Platform Roadmap (v0.38 Product Surface Reset).
- ADR-0093: SSR / ISR Runtime Contract (last addition to `types.ts` before this
  cleanup).
- v0.37.3 clean-types (pre-work: CEM deduplication, DsdRenderCollector
  extraction, legacy API removal).
