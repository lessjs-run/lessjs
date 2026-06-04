# ADR-0069: Wipe Workaround Chains — Systematic Elimination of 23 Architectural Debt Items

> **Status**: ACCEPTED
> **Date**: 2026-05-31
> **Author**: Zhi (Architect), Qi (Delivery Director), Gao (Architect), Xu (Product Manager)
> **Supersedes**: N/A (new architectural decision)
> **Based on**: 5-round full codebase audit (23 chains identified)

---

## Context

### Background

A user-initiated question — "are all virtual modules replaceable by ESM disk files?" — triggered a 5-round, 20-dimension full codebase audit. The audit uncovered **23 distinct workaround chains** accumulated across v0.10→v0.27 development.

The root cause pattern is identical across multiple chains: a **single Vite plugin ordering bug** (`ssg-package-resolver` intercepting paths it shouldn't) spawned 4 dependent workarounds (3 virtual modules + phase-context + hardcoded paths). Each workaround was then treated as architecture, creating a cascade of additional workarounds.

### What we found

**Root cause**: `createLessJsrPackageResolverPlugin` (`ssg-package-resolver.ts:176`) runs with `enforce:'pre'` and intercepts ALL `@openelement/content/*` and `@openelement/i18n/*` imports, redirecting them to source directories instead of allowing the generated-data dispatch plugins to resolve them to the correct disk files.

**Cascade effect**:

```
ssg-package-resolver intercepts @openelement/content/nav
  ↓ can't resolve _generated-nav.ts
Workaround 1: virtual:less-nav (SOP-008)
  ↓ same problem for blog/i18n
Workaround 2: virtual:less-blog-data (ADR-0018)
Workaround 3: virtual:less-i18n-data (ADR-0018)
  ↓ virtual modules need 3-phase registrations
Workaround 4: phase-context lazy dispatch
Workaround 5: build-ssg hardcoded www/ paths
Workaround 6: entry-renderer re-export binds virtual names
```

### Scope

The full audit covered:

- 20 workspace packages
- 401,000+ lines of code
- 7 GitHub Actions workflows
- 19-package dependency graph and publish order
- 5 rounds of escalating grep dimensions (8 → 12 → 16 → file-level → verification)

---

## Decision

### Architecture Principle

**ESM disk files are the canonical data channel.** Virtual modules are an internal builder concern, never a framework contract. Build-time generated `.ts` files on disk are the correct pattern for all data that is known at build time.

### Tiered Elimination Plan

We will eliminate all 23 chains in P0 → P1 → P2 → P3 order:

#### P0: Fix the Root Cause (chains 6, 1, 5, 11, 13)

**One fix, 5 chains die.**

1. Fix `ssg-package-resolver.ts` to NOT intercept `@openelement/content/nav`, `@openelement/content/blog-data`, `@openelement/i18n/data`
2. Replace `virtual:less-nav` in `less-layout.tsx` with `import from '@openelement/content/nav'`
3. Delete `virtual:less-nav` resolver from `less-plugin.ts` (+ client/ssg build files)
4. Delete `virtual:less-blog-data` and `virtual:less-i18n-data` resolvers from `phase-context.ts` + `build-ssg.ts`
5. Delete `phase-context.ts` lazy dispatch (no longer needed)
6. Delete `entry-renderer.ts` re-export code generation for virtual modules
7. Replace hardcoded `www/app/data/` paths with parameterized builder config
8. Delete `_generated-route-manifest.ts` and generator code (already done in SOP-008)

**New data flow**:

```
content/nav/scanner
  ↓ buildStart()
ctx.plugins.navSections / headerNav
  ↓ buildEnd()
_generated-nav.ts (on disk)
  ↓ generatedDataPlugin (Phase 1) / less:ssg-data-dispatch (Phase 3)
@openelement/content/nav (ESM import)
  ↓
less-layout.tsx: import { navSections, headerNav } from '@openelement/content/nav'
```

#### P1: Brand Name Cleanup (chains 2, 3, 14, 19)

Global replacement of all LessJS brand names in user-facing output:

| From                        | To                           | Location                                 |
| --------------------------- | ---------------------------- | ---------------------------------------- |
| `__LESS_CLIENT_ONLY_TAGS__` | `__CLIENT_ONLY_TAGS__`       | entry-renderer.ts, core/render-nested.ts |
| `__LESS_HEAD_EXTRAS__`      | `__HEAD_EXTRAS__`            | entry-renderer.ts, build-ssg.ts          |
| `__LESS_BLOG_BASE_PATH__`   | `__BLOG_BASE_PATH__`         | content/index.ts                         |
| `data-less-e`               | `data-eid`                   | event-hydration.ts + 6 test files        |
| `__island` / `__tagName`    | `__hydrate` / `__hydrateTag` | island-transform.ts, island.ts           |
| `<!-- LessJS ERROR: -->`    | `<!-- Render Error: -->`     | render-errors.ts                         |

#### P1: UI Autonomy (chain 4)

`less-layout` derives `locale` from `window.location.pathname` instead of requiring manual `locale=` prop on every route page.

#### P1: Core State Sanitization (chain 16)

Document and rationalize module-level mutable state. For SSR-scoped state (`_adapter`), add explicit SSR-scope management. For one-time flags (`_warnedHeadExtrasScripts`), use `Symbol` or weak set.

#### P1: Deprecated API (chain 17)

Either provide replacement for `HydrateEventDescriptor` or remove `@deprecated` annotation.

#### P2: Entry Renderer AST-based (chain 7)

Long-term: replace 785-line `lines.push()` with proper code generation. Not in P0 scope.

#### P3: Cleanup (chains 12, 15, 18, 22, 23)

One-pass cleanup: delete dead files, remove dead exports, fix CSP placeholder.

---

## Consequences

### Positive

- **3 virtual modules eliminated** from framework contract surface
- **1 lazy dispatch layer removed** (phase-context.ts shrinks significantly)
- **785-line entry-renderer simplified** (no more virtual re-exports)
- **Framework brand absent from user HTML** — zero `LessJS` in output
- **Clean ESM data flow** — disk files → import → component
- **One-root-cause fix** — 5 chains die together

### Negative

- **Breaking change**: `data-less-e` → `data-eid` requires all SSR HTML consumers to update query selectors (internal only)
- **Breaking change**: `__island`/`__tagName` rename requires island component build pipeline update
- **Risk**: SSG Phase 3 plugin ordering fix may expose other edge cases in the JSR resolver

### Neutral

- `virtual:less-hono-entry` / `virtual:less-build-trigger` remain as builder-internal mechanisms (not user-facing, not in the framework contract)
- try/catch silent swallowing (chain 8), regex-based parsing (chains 9, 21), and string code generation (chain 7) are deferred to P2/P3

---

## Alternatives Considered

### A: Keep virtual modules, add more dispatch layers

Rejected. Perpetuates the workaround cascade. Every new data type would need another virtual module.

### B: Rewrite SSG entirely

Rejected. Too much scope for v0.27. The plugin ordering fix is surgical and sufficient.

### C: Accept all chains as "technical debt backlog"

Rejected. User explicitly demanded "zero tolerance." The chains are not technical debt — they are bugs that became architecture.

---

## Execution Results（2026-05-31 Post-Mortem）

### What Succeeded (Phase B — Brand Cleanup)

All brand-leakage chains (2, 3, 14, 19) + dead code (15) + deprecated API (17) + cross-runtime (20) were fully eliminated. Verified by grep across entire repository and production build.

### What Failed (Phase A — Virtual Module Elimination)

**Attempted 3 different approaches to eliminate `virtual:less-nav/blog-data/i18n-data` as data bridges from the content layer to the UI layer. All failed at Phase 3 SSG rebuild.**

The root cause is structural: `createLessJsrPackageResolverPlugin` (in `ssg-package-resolver.ts`) manages internal dependency graph for `@openelement/ui` package during SSG rebuild. Any import of `@openelement/content/*` from within `@openelement/ui/src/less-layout.tsx` gets rewritten as a relative path inside `@openelement/ui` — even when redirected through `\0`-prefixed virtual IDs.

The 3 data virtual modules are NOT conceptual flaws — the disk files exist, the ESM path is technically correct. They are **symptoms of a pipeline ordering constraint** that would require refactoring the JSR resolver's dependency graph management. This was underestimated in the original ADR.

**8 virtual modules remain: 3 data bridges (stuck on pipeline bug), 5 builder internals (code generation, functionally equivalent to disk temp files).**

### Recommendation to Next Handler

1. P0: Fix `ssg-package-resolver` dependency graph management → 3 data virtual modules disappear
2. P1: Continue Phase D brand-adjacent cleanup (locale attrs, CSP nonce, hardcoded paths)
3. P2: Entry Renderer rewrite (v0.28 target)
4. See `SOP-009` for complete handoff checklist

---

## Implementation Plan

→ SOP-009: Wipe Workaround Chains (`docs/sop/v0.27.0/SOP-009-wipe-workaround-chains.md`)
→ Full audit report: `.workbuddy/artifacts/virtual-chains-audit.md`
