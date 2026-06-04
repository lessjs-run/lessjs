# SOP-001: Core API Freeze and Public Surface Audit

Status: planned\
Target version: v0.21.1\
Owner: core package

## Objective

Make the `@openelement/core` API intentionally shaped before v0.22.0. The goal is not to shrink the API blindly. The goal is to separate stable userland contracts from experimental framework seams and internal monorepo utilities.

## Evidence Inputs

- `packages/core/src/index.ts`
- `packages/core/src/types.ts`
- `packages/core/deno.json`
- `deno.json`
- `docs/sop/v0.21.0/README.md`
- `docs/sop/v0.22.0/README.md`
- `docs/conversation/20260524/LessJS-comprehensive-architecture-product-audit-2026-05-24.md`

## Problem Statement

v0.21.0 has a broad core export surface. That was useful while stabilizing Reactive DSD, but it creates three risks before v0.22.0:

1. userland may depend on implementation details that should remain internal;
2. stale type comments can contradict the real v0.21.0 contract;
3. Edge Full-Stack work may accidentally harden the wrong abstractions.

Known contract areas requiring review:

- `DsdComponent.render()` still needs to match the actual `TemplateResult`-first authoring model.
- legacy hydration names and remnants must not imply `hydrateEvents` is still a public v0.21 contract.
- `RendererProtocol`, `RenderOutput`, and adapter registry APIs must be classified before new edge adapters depend on them.
- security-sensitive exports such as `unsafeHTML()` and `DANGEROUS_KEYS` need explicit userland or internal status.

## Scope

Classify every exported symbol from `packages/core/src/index.ts`:

- Stable public API
- Experimental public API
- Internal package API
- Deprecated compatibility API

Create or update a public API inventory document. Suggested path:

```text
docs/reference/core-api-surface.md
```

## Procedure

1. Generate the current export list from `packages/core/src/index.ts`.
2. Cross-check each export against docs, examples, templates, and tests.
3. Mark symbols used by generated projects as stable unless there is an active migration plan.
4. Mark adapter-facing APIs as experimental if they are required for internal packages but not yet documented for third-party adapter authors.
5. Move obviously internal guidance out of public docs, or add an `@internal` comment where the repo already uses that style.
6. Fix stale type comments where the code and v0.21.0 SOP disagree.
7. Add a compact migration note for anything deprecated in v0.21.x.

## API Design Rules

- `renderDsd()` must remain the simple, synchronous renderer entrypoint.
- `renderDSDStream()` must remain an explicit streaming entrypoint and must not silently change `renderDsd()` behavior.
- `DsdElement.render()` must have one clear authoring contract. Prefer `TemplateResult` through `html` as the first-class path; string support may remain compatibility behavior if it is documented.
- `html()` escapes by default.
- `unsafeHTML()` must remain visibly unsafe and opt-in.
- `ReactiveHost` is a framework protocol, not a user ergonomics layer.
- `client:*` strategy names are `load`, `idle`, `visible`, and `only`.
- Hub and manifest schemas must be versioned data contracts, not loose helper objects.

## Acceptance Criteria

- A public API inventory exists and is linked from the relevant reference docs.
- `packages/core/src/types.ts` no longer contains comments that contradict the v0.21.0 Reactive DSD model.
- Deprecated or compatibility-only APIs are named in one place with migration guidance.
- Generated projects still compile without private import paths.
- No v0.22.0 SOP depends on an unclassified core export.

## Validation Commands

```powershell
git status --short --branch
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task docs:check-strategy
git status --short --branch
```

## Exit Decision

Proceed to SOP-002 only when the public API inventory is coherent enough that a new adapter or edge entrypoint can depend on it without guessing which symbols are stable.
