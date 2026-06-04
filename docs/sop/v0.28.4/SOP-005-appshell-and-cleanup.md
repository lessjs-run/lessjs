# SOP-005: v0.28.4 AppShell Protocol + Release Cleanup

> Version: v0.28.4
> Date: 2026-06-02
> Status: Implemented
> ADR: [ADR-0073](../../adr/ADR-0073-appshell-protocol.md)
> Output: explicit AppShell/layout protocol, strict release task coverage,
> parser-backed raw HTML sanitization, and removed compatibility residue.

## Summary

v0.28.4 turns two audit tracks into shipped code.

First, it removes cleanup debt that would weaken a v1.0 freeze: root release
tasks now cover the 19-package graph, `renderDsd()` no longer accepts legacy
positional arguments, deprecated Lit hydration exports are gone from the public
package surface, renderer raw HTML sanitization is centralized and parser-backed,
Hub client-only discovery consumes generated data as structured module data, SSR
adapter import failures are diagnosable, and the DSD report gate defaults to zero
native non-recoverable errors.

Second, it promotes application shells from an implicit `@openelement/ui\/open-layout`
implementation detail into framework configuration. Applications can now use the
default shell, no shell, a custom shell, or route-selected named layouts without
aliasing internal framework packages.

## Implemented Scope

### 1. Release Task Coverage

Root release tasks now follow the 19-package graph order:

1. `@openelement/rpc`
2. `@openelement/protocols`
3. `@openelement/router`
4. `@openelement/style-sheet`
5. `@openelement/create`
6. `@openelement/signals`
7. `@openelement/core`
8. `@openelement/runtime`
9. `@openelement/cem`
10. `@openelement/compat-check`
11. `@openelement/content`
12. `@openelement/i18n`
13. `@openelement/adapter-lit`
14. `@openelement/adapter-react`
15. `@openelement/adapter-vanilla`
16. `@openelement/adapter-vite`
17. `@openelement/ui`
18. `@openelement/hub`
19. `@openelement/app`

Updated tasks:

- `publish:*`
- `publish`
- `publish:dry-run`
- `typecheck`

### 2. `renderDsd()` Object Contract

`renderDsd()` now accepts only:

```ts
renderDsd(input, {
  componentClass,
  props,
  sourceInfo,
  dsdOptions,
  collector,
  nestingDepth,
  hooks,
});
```

Legacy positional extraction was removed from `packages/core/src/render-dsd.ts`.
Tests and generated entry code now construct the options object explicitly.

### 3. Adapter-Lit Public Surface Cleanup

`@openelement/adapter-lit` now exposes only current SSR adapter APIs from its package
root:

- `installLitAdapter`
- `uninstallLitAdapter`
- `isLitTemplateResult`
- `renderLitToString`

The deprecated root exports and subpath export for `DsdLitElement` /
`WithDsdHydration` were removed.

### 4. Parser-Backed Renderer HTML Sanitization

Renderer HTML sanitization is centralized in `packages/core/src/security.ts` via
`sanitize-html`.

The previous duplicated regex sanitizers were removed from:

- `jsx-render-string.ts`
- `jsx-render-dom.ts`
- `dsd-element.ts`

The sanitizer keeps common document/markdown HTML while blocking scripts, event
handlers, SVG/MathML namespaces, dangerous schemes, `srcdoc`, and parser edge
cases that regex sanitizers miss.

### 5. Structured Hub Client-Only Discovery

SSG Hub admission no longer regex-parses generated TypeScript text. Both dev and
SSG paths import `app/data/registry/hub-data.ts` and read
`record.tags[].compatibility` as structured data.

### 6. Optional Adapter Diagnostics

Generated SSR entry code now distinguishes missing optional adapter packages from
package-present failures:

- missing optional package: debug diagnostic
- missing expected export: warning
- package/internal import/runtime failure: warning with stack/message

### 7. Strict DSD Gate

`DEFAULT_MAX_NON_RECOVERABLE` is now `0`. Third-party errors are still classified
separately for diagnostics, but native LessJS/page/demo components no longer have
an implicit tolerance.

### 8. AppShell And Layout Protocol

Public framework options now include:

```ts
appShell?: false | 'default' | {
  tagName: string;
  import: string;
  props?: Record<string, unknown>;
};

layouts?: Record<string, AppShellConfig | undefined>;
```

Supported modes:

- `appShell: 'default'` or omitted: render `<open-layout>`
- `appShell: false`: render route content directly
- object form: import and render a custom shell
- `layouts.default`: default shell override
- `route.meta.layout = 'name'`: select a named layout
- `route.meta.layout = false`: render that route without a shell

Generated entry descriptors now carry an `appShell` plan. `renderEntry()` imports
only the shells described by that plan and renders the selected shell through
`renderDsd(shell.tagName, { props })`.

### 9. Alias Priority

The SSG package resolver now checks exact user aliases before resolving
`@openelement/*` packages. This lets an explicit alias such as
`@openelement/ui\/open-layout` win instead of being swallowed by the pre resolver.

### 10. Neutral Default Layout

`less-layout` no longer hard-codes default logo text, GitHub URL, or footer text.
Those values come from props. The LessJS documentation site explicitly configures
the branding it wants through `www/vite.config.ts`.

### 11. Deterministic Blog Dates

`parseMarkdownFile()` now derives missing post dates from `YYYY-MM-DD-*`
filenames before falling back to the current date. This prevents tracked
generated blog data from changing merely because the site was rebuilt on a new
day.

## Usage Examples

### No Shell

```ts
lessjs({
  appShell: false,
});
```

### Custom Site Shell

```ts
lessjs({
  appShell: {
    tagName: 'site-layout',
    import: './app/components/site-layout.tsx',
    props: {
      siteName: 'Field Notes',
      footerText: 'Built with LessJS',
    },
  },
});
```

### Route-Level Layouts

```ts
// app/routes/blog/[slug].tsx
export const meta = {
  layout: 'post',
};
```

```ts
lessjs({
  layouts: {
    default: {
      tagName: 'site-layout',
      import: './app/components/site-layout.tsx',
    },
    post: {
      tagName: 'post-layout',
      import: './app/components/post-layout.tsx',
    },
    bare: false,
  },
});
```

## Verification

Focused gates exercised during implementation:

- core renderer tests for `renderDsd()` and sanitizer behavior
- adapter-vite descriptor/entry renderer tests for AppShell modes
- SSG package resolver tests for exact alias priority
- content markdown tests for filename-derived blog dates
- 19-package root `typecheck`

Full release gates completed for v0.28.4:

- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno audit`
- `deno task graph:check` - 19 packages, 19 publish steps
- `deno task graph:check-imports`
- `deno task docs:check-strategy`
- `deno task docs:check-current`
- `deno task dist:check-object-object`
- `deno task test` - 1304 passed, 0 failed
- `deno task build` - 354 HTML files, DSD report: 324 pages, 0 errors
- `deno task dsd:check-report` - zero native non-recoverable errors
- `LESSJS_E2E_PORT=4175 CI=1 deno task test:e2e` - 101 passed
- `deno task publish:dry-run` - all 19 packages from a clean worktree

## Non-Goals

- No full Markdown to MDX migration.
- No runtime MDX evaluation.
- No desktop/chat application layer.
- No compatibility aliases for removed APIs.
- No AppShell router rewrite.
