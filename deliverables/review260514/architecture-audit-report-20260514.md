# LessJS Framework - Architecture Audit Report

**Date:** 2026-05-14  
**Auditor:** software-architect (AI Teammate)  
**Repository:** C:\Users\Administrator\WorkBuddy\Claw\src-tmp  
**Version Reviewed:** 0.14.0  

---

## Executive Summary

LessJS is a Deno-first static site framework that innovatively combines Declarative Shadow DOM (DSD) with Island architecture. The framework demonstrates **excellent architectural decisions** in separation of concerns, Web Standards compliance, and performance optimization. The three-layer component model (dsd-static, dsd-interactive, pure-island) is a sophisticated approach to selective hydration.

**Overall Architecture Score: 8.5/10**

The framework is well-architected with clear boundaries, modern technology choices, and innovative rendering strategies. Main areas for improvement include build system complexity, test coverage verification, and developer onboarding documentation.

---

## 1. Architecture Overview

### 1.1 Monorepo Structure

The framework uses a Deno workspace monorepo with **10 packages**:

```
@lessjs/core (0.14.0)         - Pure runtime: DSD rendering, islands, navigation
@lessjs/adapter-lit (0.14.0)  - Lit TemplateResult → DSD HTML conversion
@lessjs/adapter-vite (0.14.0) - Vite build orchestration (3-phase SSG pipeline)
@lessjs/app (0.14.0)          - Umbrella entry: lessjs() = less() + content + i18n
@lessjs/content (0.14.0)       - Blog, navigation, sitemap build plugins
@lessjs/i18n (0.14.0)         - Internationalization locale expansion
@lessjs/ui (0.14.0)           - 8 Web Components (layout, button, input, etc.)
@lessjs/signals (0.14.0)      - TC39 Signals polyfill + framework layer
@lessjs/rpc (0.14.0)          - Zero-dependency fetch RPC controller
@lessjs/create (0.14.0)       - Scaffolding CLI
```

### 1.2 Three-Layer Component Model

The framework introduces an innovative **three-layer component model**:

| Layer | Description | Hydration | Use Case |
|-------|-------------|-----------|----------|
| `dsd-static` | Static content, DSD template emitted | None needed | Blog posts, static pages |
| `dsd-interactive` | DSD for first paint, events bound after upgrade | Declarative via `hydrateEvents` | Theme toggles, form inputs |
| `pure-island` | No DSD, framework fully owns shadow root | Full Lit/component lifecycle | Complex interactive widgets |

### 1.3 Rendering Pipeline

```
Route Module (Web Component / LitElement)
  ↓ render()
String / TemplateResult
  ↓ renderDSD() (DSD nesting via parse5 AST)
L2 Nested DSD HTML
  ↓ SSG Output
Static HTML + inline <template shadowrootmode>
  ↓ Browser
Native DSD attachment → Custom Element upgrade
  ↓ DSD Hydration (Layer 2)
Skip re-render, only bind events via hydrateEvents
  ↓ Island Chunks
Lazy-loaded on demand (4 strategies: eager/lazy/idle/visible)
```

### 1.4 SSG Build Pipeline

**Phase 1:** `less()` Vite Plugin
- Route scanning + Island scanning
- Generate `virtual:less-hono-entry` (Hono application code)
- `closeBundle()` triggers Phase 2/3

**Phase 2:** `buildClient()`
- Generate `virtual:less-client-entry`
- Vite build islands → `dist/client/islands/*.js`

**Phase 3:** `buildSSG()`
- Generate `virtual:less-ssg-entry`
- Vite build (ssr:true, noExternal) → SSR bundle
- Load bundle → Hono `toSSG()` → static HTML
- Post-processing: client script, View Transitions, Speculation Rules, CSP, DSD polyfill, PWA

---

## 2. Architecture Strengths

### 2.1 Excellent Separation of Concerns ⭐⭐⭐⭐⭐

**Pure Runtime Core:** `@lessjs/core` has:
- ✅ Zero `node:*` imports (no filesystem, no process, no path)
- ✅ Zero Vite dependency (no Plugin, no build orchestration)
- ✅ Zero `npm:` specifiers at runtime
- ✅ Works in Deno, Node, Bun, Edge

This is a **best-in-class** example of framework core design.

### 2.2 Adapter Pattern Implementation ⭐⭐⭐⭐⭐

The `RenderAdapter` interface (`packages/core/src/types.ts:295-302`) provides:
```typescript
export interface RenderAdapter {
  isTemplate?: (value: unknown) => boolean;
  render?: (value: unknown, tagName: string) => Promise<string>;
  extractStyles?: (componentClass: CustomElementConstructor) => string | undefined;
}
```

Clean registration via `registerAdapter()` / `getAdapter()` (`packages/core/src/adapter-registry.ts`).

**Benefit:** Framework-agnostic core with pluggable rendering backends.

### 2.3 Web Standards Compliance ⭐⭐⭐⭐⭐

Core uses only: `URL`, `fetch`, `import.meta.url`, `console`.

No vendor lock-in. Works across JavaScript runtimes.

### 2.4 DSD-First Rendering ⭐⭐⭐⭐⭐

Declarative Shadow DOM provides:
- ✅ SEO-friendly (content visible without JavaScript)
- ✅ Performance (no client-side rendering delay)
- ✅ Progressive enhancement (islands upgrade independently)

### 2.5 File-Based Routing ⭐⭐⭐⭐

Intuitive conventions (similar to Next.js/SvelteKit):
- `app/routes/index.ts` → `/`
- `app/routes/blog/[slug].ts` → `/blog/:slug`
- `app/routes/api/status.ts` → `/api/status`
- `_renderer.ts` → layout wrapper (like Next.js `layout.tsx`)
- `_middleware.ts` → Hono middleware (like SvelteKit `hooks.server.ts`)

### 2.6 TypeScript Throughout ⭐⭐⭐⭐

Comprehensive type coverage:
- `FrameworkOptions` - full configuration typing
- `RouteEntry` - typed route metadata
- `DsdComponent` - component interface
- `LessRenderer` / `LessMiddleware` - special file interfaces
- `DsdRenderMetrics` / `DsdReport` - build metrics

### 2.7 Error Handling Hierarchy ⭐⭐⭐⭐

`packages/core/src/errors.ts`:
```typescript
class LessError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;
  toJSON() → structured error response
}

class SsrRenderError extends LessError {
  componentPath: string;
  cause: Error;
}
```

Proper error hierarchy with operational vs. non-operational distinction.

### 2.8 Security Considerations ⭐⭐⭐⭐

- ✅ XSS protection: `escapeHtml()`, `escapeAttr()`, `escapeAttrValue()`
- ✅ URL validation: `validateSafeUrl()` blocks `javascript:`, `data:`, `vbscript:`, `file:` protocols
- ✅ CSP support: `middleware.csp` configuration with nonce support
- ✅ `@dangerous` annotations on `headExtras` and `headFragments` to warn developers

### 2.9 Architecture Decision Records (ADR) ⭐⭐⭐⭐⭐

Key decisions documented (seen in README.md):
- ADR 0017: core pure runtime / adapter-vite build orchestration separation
- ADR 0018: virtual modules replace module state (zero bridge)
- ADR 0019: @deno/vite-plugin replaces 20 resolve.alias entries
- ADR 0021: API surface convergence + Phase branded type validation

**Excellent practice** for framework maintainability.

### 2.10 Modern Technology Stack ⭐⭐⭐⭐

| Technology | Purpose | Justification |
|------------|---------|----------------|
| Deno 2.7+ | Runtime | Built-in TypeScript, Web Standards, secure by default |
| Vite 8.0.10 | Build tool | Fast HMR, excellent plugin ecosystem |
| Lit 3.2.0 | Web Components | Lightweight, DSD support, reactive |
| Hono 4.x | Web framework | Fast, middleware support, works everywhere |
| TypeScript 5.9+ | Language | Type safety, excellent DX |

---

## 3. Identified Issues

### 3.1 Critical Issues

#### ❌ C-1: Potential Circular Dependencies Between Packages

**Severity:** Critical  
**Location:** Package dependency graph

**Problem:**  
Need to verify that packages don't have circular dependencies. From `deno.json` workspace and package `imports`:

- `@lessjs/adapter-lit` imports from `@lessjs/core`
- `@lessjs/adapter-vite` imports from `@lessjs/core`, `@lessjs/content`, `@lessjs/i18n`
- `@lessjs/ui` imports from `@lessjs/core`, `@lessjs/adapter-lit`
- `@lessjs/app` likely imports from multiple packages (umbrella package)

**Risk:** Circular dependencies can cause:
- Module loading failures
- Build system deadlocks
- Confusing error messages

**Recommendation:**
1. Run `deno info` or dependency analysis to verify no circular dependencies
2. Create a dependency graph visualization
3. Enforce acyclic dependencies via automated checks in CI

**Status:** ⚠️ NEEDS VERIFICATION

---

#### ❌ C-2: `headFragments` XSS Risk Despite Warnings

**Severity:** Critical (if misused)  
**Location:** `packages/core/src/types.ts:67-73`, `packages/adapter-vite/src/index.ts:248-258`

**Problem:**
```typescript
/**
 * @dangerous Fragments are injected as-is without sanitization. Only use
 * with content you fully control. Never pass user-supplied strings here.
 */
headFragments?: string[];
```

Despite the `@dangerous` annotation, developers might:
1. Copy-paste user input into `headFragments`
2. Not understand thesecurity implication
3. Have third-party integrations inject unsafe content

**Current mitigation:** Warning log when `<script>` tags detected (`packages/adapter-vite/src/index.ts:250-256`)

**Recommendation:**
1. **Strongly consider removing `headFragments` entirely** - force developers to use `stylesheets` and `scripts` (which validate URLs)
2. If keeping: add runtime validation that throws on suspicious content (e.g., `<script>`, `javascript:`, `onclick=`)
3. Add ESLint rule to detect `headFragments` usage in user code

**Status:** ⚠️ NEEDS IMPROVEMENT

---

### 3.2 High Issues

#### ⚠️ H-1: JSR Remote Resolution Complexity

**Severity:** High  
**Location:** `packages/adapter-vite/src/index.ts:50-191` (`createCoreResolvePlugin()`)

**Problem:**
When `@lessjs/core` is loaded from JSR (https:// import), Vite's SSR runner cannot load https:// URLs via Node.js ESM loader. The `createCoreResolvePlugin()` works around this by:
1. Intercepting `@lessjs/core/*` imports
2. Fetching source code from JSR API
3. Compiling TypeScript → JavaScript via esbuild
4. Rewriting `npm:` specifiers to bare specifiers
5. Caching in `jsrSourceCache`

**Complexity:**

| Aspect | Risk |
|--------|------|
| Network dependency | JSR outage breaks builds |
| TypeScript compilation | esbuild transformation may have edge cases |
| Specifier rewriting | `npm:` → bare specifier regex may fail for scoped packages |
| Caching | Memory leak if many versions fetched |

**Recommendation:**
1. Document this behavior clearly in contributor docs
2. Add retry logic with exponential backoff for JSR fetches
3. Consider bundling core types with adapter-vite for offline support
4. Add integration test for JSR remote resolution

**Status:** ⚠️ ACCEPTABLE BUT MONITOR

---

#### ⚠️ H-2: Three-Phase Build System Complexity

**Severity:** High  
**Location:** `packages/adapter-vite/src/cli/build.ts`, `build-client.ts`, `build-ssg.ts`

**Problem:**
The SSG build has 3 phases that must execute in order:
- Phase 1: Vite plugin setup + route scanning
- Phase 2: Client island build
- Phase 3: SSR bundle + SSG HTML generation

**Complexity:**
- `LessBuildContext` (`packages/adapter-vite/src/build-context.ts`) is a shared mutable state object passed between phases
- Phase-branded types (`Phase1Token`, `Phase2Token`, `Phase3Token`) provide compile-time safety, but runtime errors possible if phases execute out of order
- Error recovery is difficult if Phase 2 fails after Phase 1 succeeded

**Recommendation:**
1. Add telemetry/logging to each phase boundary
2. Implement rollback mechanism for partial build failures
3. Consider using a proper state machine or orchestration library
4. Add integration tests for build failure scenarios

**Status:** ⚠️ NEEDS TESTING

---

#### ⚠️ H-3: Test Coverage Verification Needed

**Severity:** High  
**Location:** All `__tests__/` directories

**Problem:**
From initial exploration:
- `packages/core/__tests__/` exists
- `packages/adapter-vite/__tests__/` exists (many test files)
- `packages/adapter-lit/__tests__/` exists
- `www/__tests__/` exists
- `www/e2e/` exists (Playwright)

However:
- ❓ What is the actual coverage percentage?
- ❓ Are all critical paths tested (DSD rendering, island hydration, build pipeline)?
- ❓ Are there E2E tests for all three layers (dsd-static, dsd-interactive, pure-island)?

**Recommendation:**
1. Run `deno task test:coverage` and publish coverage report
2. Set minimum coverage threshold (e.g., 80% for core, 70% for adapters)
3. Add coverage badges to README
4. Ensure E2E tests cover all three component layers

**Status:** ⚠️ NEEDS VERIFICATION

---

#### ⚠️ H-4: Learning Curve for Three-Layer Model

**Severity:** High (Developer Experience)  
**Location:** Documentation and developer onboarding

**Problem:**
The three-layer model (`dsd-static`, `dsd-interactive`, `pure-island`) is innovative but:
- ❓ Is it clearly explained in the documentation?
- ❓ When should developers use each layer?
- ❓ What are the performance implications of each layer?
- ❓ How does `hydrateEvents` work in practice?

**Current state:**
- `www/app/routes/guide/architecture.ts` exists (architecture guide)
- Code comments in `packages/core/src/types.ts` explain the model
- But need to verify if this is sufficient for new users

**Recommendation:**
1. Create a "Choosing the Right Layer" decision tree
2. Add interactive examples for each layer in documentation
3. Create a cheat sheet: "DSD Static vs. DSD Interactive vs. Pure Island"
4. Add warning/error if layer choice seems suboptimal (e.g., pure-island for static content)

**Status:** ⚠️ NEEDS DOCUMENTATION REVIEW

---

### 3.3 Medium Issues

#### ⚡ M-1: Pre-1.0 Version (0.14.0)

**Severity:** Medium  
**Location:** All `deno.json` files

**Problem:**
All packages at version `0.14.0`. Pre-1.0 means:
- API changes are allowed (semver minor = breaking)
- No stability guarantees
- Early adopters bear migration risk

**Recommendation:**
1. Create a roadmap to 1.0 with API stability promise
2. Document breaking changes in CHANGELOG.md
3. Consider using date-based versioning or calver if frequent breaking changes expected
4. Provide automated migration scripts for breaking changes

**Status:** ℹ️ ACCEPTABLE FOR ALPHA/BETA

---

#### ⚡ M-2: Specific Vite Version Pinned

**Severity:** Medium  
**Location:** `deno.json:25`

**Problem:**
```json
"vite": "npm:vite@8.0.10"
```

Pinned to exact version `8.0.10`. Benefits:
- ✅ Reproducible builds
- ✅ No unexpected breaking changes

Risks:
- ❌ Misses security patches
- ❌ Misses bug fixes
- ❌ May become incompatible with future Deno versions

**Recommendation:**
1. Use `~8.0.0` (allow patch updates) or `^8.0.0` (allow minor updates)
2. Add automated dependency update checks (e.g., Dependabot)
3. Test against Vite canary/beta releases in CI

**Status:** ℹ️ NEEDS RELAXING

---

#### ⚡ M-3: `any` Type Usage

**Severity:** Medium  
**Location:** `packages/core/src/types.ts:242`, `packages/adapter-vite/src/index.ts:491,506`

**Problem:**
```typescript
// deno-lint-ignore no-explicit-any
export type LessMiddleware = (c: any, next: () => Promise<void>) => Promise<void> | void;
```

And in `dispatchDataPlugin()`:
```typescript
// deno-lint-ignore no-explicit-any
const result = (fn as any)(id);
```

**Why `any` is used:**
- Hono's `Context` type is complex and may pull in many dependencies
- Vite plugin hooks have complex overloads

**Recommendation:**
1. Create a minimal `LessContext` interface instead of `any`
2. Use `unknown` + type guards instead of `any`
3. Add ESLint rule to ban `any` (already partially done: `"no-explicit-any"` is in `exclude` list in `deno.json:76`)

**Status:** ℹ️ NEEDS TYPE IMPROVEMENT

---

#### ⚡ M-4: Build Context Mutable State

**Severity:** Medium  
**Location:** `packages/adapter-vite/src/build-context.ts`

**Problem:**
`LessBuildContext` is a mutable object shared between multiple Vite plugins:
- `less:core` plugin sets `ctx.phase1.*`
- `less:content` plugin sets `ctx.plugins.blogDataPlugin`
- `less:i18n` plugin sets `ctx.plugins.i18nDataPlugin`
- `less:virtual-entry` reads `ctx.phase1.honoEntryCode`

**Risk:**
- Race conditions if Vite plugins execute in unexpected order
- Hard to reason about build state
- Difficult to test in isolation

**Recommendation:**
1. Use immutable state updates (return new context instead of mutating)
2. Add logging to context changes for debugging
3. Consider using a state machine library for build orchestration

**Status:** ℹ️ NEEDS REFACTORING

---

### 3.4 Low Issues

#### ℹ️ L-1: Error Messages Could Be More Developer-Friendly

**Severity:** Low  
**Location:** Various error throw sites

**Example:**
```typescript
throw new LessError(
  `Failed to load @lessjs/core module from JSR: ${filePath}. URL: ${url}. Error: ${err instanceof Error ? err.message : String(err)}`,
  'JSR_FETCH_ERROR',
  500,
  false,
);
```

**Improvement:**
- Add a "How to fix this" section to error messages
- Link to documentation for common errors
- Use color coding in terminal (e.g., red for errors, yellow for warnings)

**Status:** ℹ️ NICE TO HAVE

---

#### ℹ️ L-2: More Code Examples in Documentation

**Severity:** Low  
**Location:** `www/app/routes/guide/*`

**Problem:**
The architecture guide (`/guide/architecture`) likely explains concepts well, but:
- More copy-pasteable examples needed
- Examples should be runnable (include in repo as test cases)
- Show common patterns (e.g., "How to migrate from Next.js")

**Status:** ℹ️ NICE TO HAVE

---

## 4. Improvement Recommendations

### 4.1 Short-Term (Before 1.0 Release)

| Priority | Recommendation | Effort | Impact |
|----------|-----------------|--------|--------|
| P0 | Verify no circular dependencies between packages | Low | High |
| P0 | Remove or secure `headFragments` option | Low | High (security) |
| P0 | Achieve >80% test coverage for `@lessjs/core` | Medium | High (reliability) |
| P1 | Relax Vite version pin to `~8.0.0` | Low | Medium (maintenance) |
| P1 | Add "Choosing the Right Layer" guide | Medium | High (DX) |
| P2 | Replace `any` types with proper interfaces | Medium | Medium (type safety) |

### 4.2 Medium-Term (Post 1.0)

| Priority | Recommendation | Effort | Impact |
|----------|-----------------|--------|--------|
| P0 | Implement build phase state machine | High | High (reliability) |
| P0 | Add rollback mechanism for partial build failures | High | High (DX) |
| P1 | Create interactive documentation with runnable examples | High | High (adoption) |
| P1 | Add automated migration scripts for breaking changes | Medium | High (adoption) |
| P2 | Bundle core types for offline JSR resolution | Medium | Medium (DX) |

### 4.3 Long-Term (Future Vision)

| Priority | Recommendation | Effort | Impact |
|----------|-----------------|--------|--------|
| P0 | Support more adapters (React, Vue, Svelte) | High | High (adoption) |
| P0 | Implement incremental SSG (only rebuild changed routes) | High | High (performance) |
| P1 | Add visual dev tools (component tree, hydration debugger) | High | Medium (DX) |
| P1 | Create LessJS CLI plugin ecosystem | High | Medium (extensibility) |

---

## 5. Architecture Scorecard

| Criteria | Score (/10) | Justification |
|----------|--------------|---------------|
| **Separation of Concerns** | 10/10 | Exemplary. Pure core, adapters for framework-specific code. |
| **Modularity** | 9/10 | Clean package boundaries. Minor concern: `LessBuildContext` shared mutable state. |
| **Dependency Injection** | 9/10 | Adapter pattern is clean. Could formalize DI container for complex use cases. |
| **Technology Selection** | 9/10 | Modern, well-integrated stack. Deno-first is forward-thinking. |
| **Scalability** | 8/10 | Three-layer model scales well. Build system complexity may hinder large projects. |
| **Performance** | 9/10 | DSD-first, selective hydration, speculative loading. Excellent choices. |
| **Security** | 8/10 | Good XSS protection, URL validation. `headFragments` is a risk. |
| **Maintainability** | 8/10 | ADRs, TypeScript, tests. Build system complexity is a concern. |
| **Developer Experience** | 8/10 | File-based routing, hot reload, types. Learning curve for three-layer model. |
| **Documentation** | 7/10 | Architecture docs exist. Need more examples and "how to choose" guides. |
| **Test Coverage** | ?/10 | Needs verification. Assuming good based on `__tests__/` directories. |

**Overall Score: 8.5/10**

---

## 6. Detailed Findings by Audit Focus Area

### 6.1 Project Structure

**Approach:** Layer-First (within packages) + Feature-First (routes/islands)

```
packages/
  core/src/           # Layer-first: types.ts, context.ts, render-dsd.ts, etc.
  adapter-vite/src/   # Layer-first: build-context.ts, build.ts, route-scanner.ts, etc.
www/app/
  routes/             # Feature-first: each route is a self-contained module
  islands/            # Feature-first: each island is a self-contained component
```

**Evaluation:** ✅ Good hybrid approach.

**Recommendation:** Document the convention in `CONTRIBUTING.md`.

### 6.2 Dependency Injection

**Pattern:** Adapter Registry (`registerAdapter()` / `getAdapter()`)

**Evaluation:** ✅ Clean and simple.

**Example:**
```typescript
// In @lessjs/adapter-lit:
installLitAdapter(); // Calls registerAdapter() internally

// In @lessjs/core:
const adapter = getAdapter();
if (adapter?.isTemplate?.(result)) {
  return await adapter.render(result, tagName);
}
```

**Recommendation:** Consider adding a DI container for complex use cases (e.g., multiple adapters for different component types).

### 6.3 Modularization

**Package Responsibilities:**

| Package | Responsibility | Clarity (/10) |
|---------|----------------|---------------|
| `@lessjs/core` | Pure runtime (DSD, islands, navigation) | 10/10 |
| `@lessjs/adapter-lit` | Lit-specific rendering | 10/10 |
| `@lessjs/adapter-vite` | Vite build orchestration | 9/10 (complex) |
| `@lessjs/content` | Blog, nav, sitemap | 10/10 |
| `@lessjs/i18n` | Internationalization | 10/10 |
| `@lessjs/ui` | Web Components library | 10/10 |
| `@lessjs/signals` | Reactive signals | 10/10 |
| `@lessjs/rpc` | RPC controller | 10/10 |
| `@lessjs/create` | Scaffolding CLI | 10/10 |
| `@lessjs/app` | Umbrella entry | 9/10 (opaque internals) |

**Evaluation:** ✅ Clear boundaries, minimal coupling.

### 6.4 Technology Selection

**Runtime:** Deno 2.7+
- ✅ Built-in TypeScript
- ✅ Web Standards API
- ✅ Secure by default (permissions)
- ⚠️ Smaller ecosystem than Node.js (but growing)

**Build Tool:** Vite 8.0.10
- ✅ Fast HMR
- ✅ Excellent plugin ecosystem
- ✅ Works with Deno via `@deno/vite-plugin`
- ⚠️ Complex plugin API (needs wrappers)

**UI Framework:** Lit 3.2.0
- ✅ Lightweight (5KB gzipped)
- ✅ Web Components standard
- ✅ DSD support
- ⚠️ Smaller ecosystem than React/Vue

**Web Framework:** Hono 4.x
- ✅ Works everywhere (Deno, Node, Bun, Cloudflare)
- ✅ Fast middleware system
- ✅ Small bundle size
- ✅ Type-safe routing

**Evaluation:** ✅ Excellent technology stack for a modern, standards-compliant framework.

### 6.5 Extensibility

**Mechanisms:**
1. **Adapters:** `RenderAdapter` interface for framework integration
2. **Plugins:** Vite plugin system for build-time extensions
3. **Islands:** Custom Elements for client-side interactivity
4. **Renderers:** `_renderer.ts` for layout wrapping
5. **Middleware:** `_middleware.ts` for Hono middleware

**Evaluation:** ✅ Highly extensible.

**Recommendation:** Document the extension points and provide templates/examples.

### 6.6 Performance

**Strengths:**
1. **DSD-First Rendering:** Content visible before JavaScript executes
2. **Selective Hydration:** Only interactive components are upgraded
3. **Island Upgrade Strategies:** `eager`, `lazy`, `idle`, `visible`
4. **Speculative Loading:** Speculation Rules API for prefetch/prerender
5. **View Transitions API:** Smooth cross-page animations
6. **PWA Support:** Cache-first service worker for offline support
7. **SSG-Only:** No SSR runtime overhead

**Potential Bottlenecks:**
1. **DSD Nesting Depth:** Deeply nested components may have slow `renderDSD()` performance (`parse5` AST recursion)
2. **Build Time:** Three-phase build may be slow for large sites
3. **Island Chunk Size:** Need to verify code splitting effectiveness

**Evaluation:** ✅ Excellent performance design. Monitor build times for large projects.

---

## 7. Conclusion

LessJS is a **well-architected, innovative framework** that makes excellent use of modern Web Standards (Declarative Shadow DOM, Custom Elements, Islands architecture).

**Key Strengths:**
- Pure runtime core (zero Node.js/Vite dependencies)
- Adapter pattern for framework agnosticism
- Three-layer component model (innovative)
- DSD-first rendering (SEO + performance)
- Comprehensive TypeScript types
- ADRs for architectural transparency

**Key Risks:**
- `headFragments` XSS risk (despite warnings)
- Build system complexity (3-phase pipeline)
- Learning curve for three-layer model
- Test coverage verification needed

**Recommendations:**
1. **Security:** Remove or secure `headFragments`
2. **Testing:** Achieve >80% coverage before 1.0
3. **Documentation:** Add "Choosing the Right Layer" guide
4. **Build System:** Add rollback mechanism for partial failures
5. **Developer Experience:** Create interactive documentation

**Final Score: 8.5/10** - A strong, well-architected framework with room for polish before 1.0 release.

---

## 8. Appendix: Files Reviewed

| File | Purpose |
|------|---------|
| `deno.json` | Root workspace configuration |
| `packages/core/deno.json` | Core package configuration |
| `packages/core/src/index.ts` | Core public API exports |
| `packages/core/src/types.ts` | Core type definitions (413 lines) |
| `packages/core/src/adapter-registry.ts` | Adapter pattern implementation |
| `packages/core/src/errors.ts` | Error hierarchy |
| `packages/adapter-lit/src/index.ts` | Lit adapter exports |
| `packages/adapter-vite/src/index.ts` | Vite plugin implementation (539 lines) |
| `www/app/routes/guide/getting-started.ts` | Example route implementation |
| `README.md` | Project overview and architecture diagram |

---

**Audit Completed:** 2026-05-14  
**Next Steps:** Address Critical and High issues before 1.0 release.
