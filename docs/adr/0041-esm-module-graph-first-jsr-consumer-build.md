# ADR-0041: ESM Module Graph First for JSR Consumer Builds

> **Status**: ACCEPTED
> **Date**: 2026-05-24
> **Applies to**: v0.21.9
> **Extends**: ADR-0033, ADR-0037, ADR-0038

## Context

LessJS v0.21.x is a Deno workspace published to JSR and consumed by generated
applications through `deno run -A jsr:@openelement/create`. The intended architecture
is standards-first ESM:

1. LessJS packages expose TypeScript ESM entrypoints through JSR exports.
2. Application source imports stable bare specifiers such as `@openelement/core`,
   `@openelement/ui/less-card`, and `@openelement/signal/framework`.
3. Vite/Rolldown performs the final production bundle, tree-shaking, and code
   splitting.

Recent JSR consumer smoke tests exposed a boundary leak. The adapter-vite SSG
pipeline fetched JSR source files into virtual modules, then handed those
modules to Vite. Source that was valid under Deno/JSR package resolution could
still contain metadata-resolved specifiers such as:

```text
jsr:@openelement/signal@^0.21/framework
```

Vite/Rolldown does not natively own Deno's `jsr:` package scheme. When the SSG
pipeline bypasses Deno's resolver and fetches source manually, LessJS must not
leave Deno/JSR resolution semantics half-applied inside the Vite module graph.

## Decision

**LessJS v0.21.9 will treat the ESM module graph as the primary contract for
published package consumption. Vite/Rolldown remains the final bundler only.**

This means:

1. Userland and generated app code import LessJS through stable ESM bare
   specifiers.
2. Package `exports` define the public entrypoint graph.
3. Package `imports` may point at `jsr:` for Deno/JSR resolution, but `jsr:`
   specifiers must not leak into any Vite/Rolldown bundle graph.
4. adapter-vite must provide a centralized LessJS package graph bridge for SSG
   when it consumes published JSR source outside Deno's native resolver.
5. The bridge must be package-aware, export-aware, version-aware, and tested
   against a generated consumer project.

## Architecture Boundary

```
Generated app source
  imports @openelement/app, @openelement/core, @openelement/ui/*
        |
        v
Deno / JSR package resolution
  resolves package exports and imports
        |
        v
LessJS ESM module graph
  stable bare specifiers and virtual ids only
        |
        v
adapter-vite SSG package graph bridge
  normalizes LessJS package entrypoints for Vite
        |
        v
Vite / Rolldown
  bundle, tree-shake, split chunks
```

Vite is not responsible for understanding Deno-specific package schemes.
LessJS is responsible for ensuring the module graph handed to Vite is ordinary
bundler-consumable ESM.

## Required Invariants

- Published LessJS package versions are unified for a release train.
- Public package entrypoints are declared through `exports`.
- Internal monorepo dependencies use stable LessJS bare specifiers in source.
- `jsr:@openelement/*` may appear in Deno package metadata, but not in generated
  Vite virtual entries or unresolved Vite/Rolldown logs.
- adapter-vite SSG resolution must not be a list of one-off special cases.
- Consumer smoke tests must exercise the JSR-published path, not only the local
  workspace path.

## Non-Goals

- Do not replace Vite/Rolldown.
- Do not introduce a custom general-purpose bundler.
- Do not force application authors to import `jsr:` specifiers in app source.
- Do not add npm publishing as a workaround for the v0.21.x consumer path.
- Do not widen v0.21.9 into Edge Full-Stack runtime work.

## Consequences

### Positive

- The generated app path matches the product story: ESM first, standards first,
  Vite final bundling.
- JSR package consumption becomes a release gate instead of an after-publish
  surprise.
- The SSG pipeline gets a single ownership boundary for package graph
  normalization.
- Future packages such as content, i18n, UI, and adapters can be checked against
  the same graph rules.

### Negative

- adapter-vite must own more package-resolution logic than a purely local
  workspace build needs.
- Release validation now needs an external-style consumer smoke test.
- Version drift across packages becomes a blocking release issue.

## Acceptance Signals

v0.21.9 is accepted only when:

1. all `packages/*/deno.json` LessJS dependency imports are version-aligned;
2. a generated JSR consumer app builds from outside the workspace;
3. Vite/Rolldown receives no unresolved `jsr:@openelement/*` specifier;
4. the SSG package graph bridge is centralized and tested;
5. release docs record the exact consumer validation command.

## Related

- ADR-0033: Architecture Positioning: SSG Islands
- ADR-0037: DSD-First Strategic Boundary
- ADR-0038: ISR + Edge KV Architecture
- `docs/sop/v0.21.x/SOP-011-jsr-consumer-esm-graph.md`
