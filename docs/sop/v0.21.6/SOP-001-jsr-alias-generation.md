# SOP-001: Fix ADR-0015 JSR-mode Alias Generation

Status: implemented\
Target version: v0.21.6\
Owner: @openelement/adapter-vite

## Objective

Make the LessJS Vite plugin's auto-alias generation work correctly when the
plugin itself is loaded from JSR (not a local workspace). Currently aliases are
only generated from `file://` import.meta.url; from JSR the URL is HTTPS and
the generation is silently skipped.

## Problem Statement

ADR 0015 introduced auto-generated Vite resolve aliases for `@openelement/core/*`
subpath imports, so consumers don't need to manually list them in `vite.config.ts`.
The implementation uses `import.meta.url` to locate package source directories:

```typescript
// Current (broken from JSR)
const selfUrl = import.meta.url; // https://jsr.io/@openelement/adapter-vite/0.21.5/src/index.ts
// path resolution fails because it's not file://
```

When `@openelement/adapter-vite` is consumed via JSR (the normal user path), the
plugin's own code comes from `https://jsr.io/...`. The alias generation logic
expects `file://` URLs and silently produces no aliases.

## Scope

1. Make `import.meta.url` resolution work for both `file://` and `https://` URLs
2. Generate a minimal set of aliases for `@openelement/core` subpath exports
3. Ensure generated aliases work on Windows (no URL mangling)
4. Test: `less create test && cd test && deno task build` on both Windows and Linux

## Root Cause Analysis

The `config()` hook in `packages/adapter-vite/src/index.ts` (or wherever the
alias generation lives) uses `fileURLToPath(new URL('.', import.meta.url))` to
find the package directory. `fileURLToPath()` throws on HTTPS URLs.

## Proposed Fix

```typescript
function getPackageRoot(): string {
  const selfUrl = import.meta.url;
  if (selfUrl.startsWith('file://')) {
    return fileURLToPath(new URL('.', selfUrl));
  }
  // JSR mode: parse the JSR URL to derive package root
  // e.g., https://jsr.io/@openelement/adapter-vite/0.21.5/src/index.ts
  // → https://jsr.io/@openelement
  const match = selfUrl.match(/^(https:\/\/jsr\.io\/@[^/]+\/[^/]+)\/\d+\.\d+\.\d+/);
  if (match) return match[1];
  throw new Error(`Cannot determine package root from ${selfUrl}`);
}
```

Then generate aliases using `getPackageRoot()` to resolve sibling packages.

## Acceptance Criteria

- [ ] `less create test-blog && cd test-blog && deno task build` exits 0 on Linux
- [ ] Same command exits 0 on Windows
- [ ] Generated `dist/index.html` contains actual page content (not blank)
- [ ] No hardcoded JSR URL aliases in generated `vite.config.ts`
- [ ] Existing workspace-mode builds are unaffected

## Validation Commands

```powershell
# JSR consumer test (standalone)
deno run -A jsr:@openelement/create test && cd test && deno task build

# In-repo verification
deno task fmt:check && deno task lint && deno task typecheck
deno audit && deno task test
```

## Exit Decision

Pass when a JSR-consumed generated project builds on both Windows and Linux.
