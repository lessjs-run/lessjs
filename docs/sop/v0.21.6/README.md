# LessJS v0.21.6 Hotfix Line

Status: complete\
Range: after v0.21.5 hardening, before v0.22.0 Edge Full-Stack\
Owner: framework architecture\
Trigger: v0.21.5 standalone consumer build failure on Windows

## Purpose

v0.21.5 proved the core is hardened and gates pass. But the "build from JSR outside
the monorepo" path — the user-facing path — has a real gap. v0.21.6 exists to fix
that gap so `less create my-blog && cd my-blog && deno task build` works end-to-end
on all platforms.

This is NOT a feature line. It is a targeted hotfix line with a clear exit
condition: **a generated project builds cleanly from JSR on Windows**.

## Issues Discovered (2026-05-24)

### P0 — ADR-0015 JSR-mode alias generation

When `@lessjs/adapter-vite` runs from JSR (not monorepo workspace), its `import.meta.url`
is an HTTPS URL. The plugin's `config()` hook uses `import.meta.url` to find package
directories and generate Vite resolve aliases — but this logic only works for
`file://` URLs. From JSR, no aliases are generated, and Vite SSR can't resolve
`@lessjs/core` imports in the virtual SSR entry.

**Manifestation**: `Rolldown failed to resolve import "@lessjs/core" from "virtual:less-ssg-entry"`

**Affects**: All standalone JSR consumer projects (any platform, not just Windows).

### P0 — create template hardcoded JSR URL aliases

The `create/cli.ts` template generates `vite.config.ts` with hardcoded JSR URL
aliases for each UI component (e.g., `'https://jsr.io/@lessjs/ui/0.21.5/src/less-card.ts'`).
Three problems:

1. **Redundant** — the plugin should auto-generate these (see P0 above).
2. **Broken on Windows** — Rolldown mangles `https://` URLs into `https:/` paths,
   causing "os error 123" (invalid filename/volume syntax).
3. **Fragile** — version numbers are hardcoded per-component.

**Fix**: Remove hardcoded aliases from the template. Let the plugin handle them.

### P1 — Windows CI coverage for JSR consumer build

The `create` package integration test patched imports from JSR to local source
to work around the alias gap. v0.21.6 should add a CI job that builds from actual
JSR imports (without patch) on ubuntu + windows.

### P2 — CodeQL default/advanced setup conflict

When a repo has both GitHub's default CodeQL setup AND a custom `codeql.yml`,
the custom workflow fails: "CodeQL analyses from advanced configurations cannot
be processed when the default setup is enabled." Users must manually disable the
default setup. Document this in the CI setup guide.

### P2 — PowerShell `@'...'@` HERE string leaks into git commits

On Windows, `git commit -m @'...'@` prefixes the first line with `@`. Workaround:
use `printf 'subject' '' 'body' > /tmp/msg && git commit -F /tmp/msg`. Document
in CONTRIBUTING.md.

## SOP List

| SOP     | Target                                                | Owner                | Priority | Status     |
| ------- | ----------------------------------------------------- | -------------------- | -------- | ---------- |
| SOP-001 | Fix ADR-0015 JSR-mode alias generation                | @lessjs/adapter-vite | P0       | ✅ Done    |
| SOP-002 | Remove hardcoded JSR URL aliases from create template | @lessjs/create       | P0       | ✅ Done    |
| SOP-003 | Add Windows + ubuntu CI for JSR consumer build        | CI config            | P1       | ✅ Done    |
| SOP-004 | ~~Document CodeQL setup conflict resolution~~         | —                    | —        | ❌ Removed |
| SOP-005 | Document PowerShell git commit workaround             | docs                 | P2       | ✅ Done    |

## Non-Goals

v0.21.6 must NOT:

- Add features (no new APIs, no new packages)
- Change public API surface
- Expand v0.22 scope
- Introduce breaking changes

## Validation Gate

```powershell
# In a temp directory, simulate the user journey:
deno run -A jsr:@lessjs/create test-blog
cd test-blog
deno task build          # must exit 0
ls dist/index.html       # must exist and contain valid HTML
```

Plus the standard gate:

```powershell
deno task fmt:check
deno task lint
deno task typecheck
deno audit
deno task test
deno task build
```

## Exit Decision

v0.21.6 is complete when `deno task build` passes on a JSR-consumed generated
project on both Windows and Linux.
