# LessJS v0.14.1

> 6 commits since v0.14 (a04a7e5 → b062d20), 75 files changed

## Bug Fixes

- **Blank page on first load**: `inject.scripts` (theme-init.js) was emitted before `inject.headFragments` (anti-flash cloak). When theme-init.js ran to remove the cloak, the `<style id="less-anti-flash">` element didn't exist in the DOM yet. The anti-flash style was applied after theme-init.js ran and never removed, leaving the page `visibility: hidden` permanently. Fixed by swapping output order: headFragments first, scripts second.
- **Speculation Rules parsing error**: Home page rule had both `where: {}` (document matcher) and `source: 'list'` + `urls: ['/']` (list matcher), which the Speculation Rules API forbids.
- **prism-html.min.js 404**: Prism has no `prism-html` component. HTML syntax highlighting uses `prism-markup`.
- **GoatCounter URL**: Protocol-relative URL (`//gc.zgo.at/`) changed to full HTTPS.
- **Service Worker**: Only intercepts same-origin requests now — cross-origin CDN/analytics pass through. `networkFirst` returns 503 instead of throwing.

## Build & CI

- **`deno task publish`**: Now checks `git status --porcelain` before publishing (refuses dirty worktree). No more `--allow-dirty`.
- **Publish order**: All 10 packages in correct dependency order (rpc → signals → core → adapter-vite → content → i18n → adapter-lit → ui → app → create).
- **CI lint/test**: Now runs `deno task fmt:check` and `deno task lint` on all files (was restricted to `packages/` only). publish-manual now runs test workflow as dependency.
- **`publish:dry-run` task added**: Pre-flight check for all packages.
- **`allowHeadExtrasScripts`**: New flag on `Phase3Meta` and `buildPlugin()` to allow structured injection APIs to produce inline scripts.

## Signals (`@lessjs/signals`)

- **`@lessjs/signal` → `@lessjs/signals`**: Package name standardised to match directory name. All references updated: `deno.json`, `README.md`, CI publish tasks, `publish.yml`.
- **`ReadonlySignal` type**: Added generic constraint for `subscribe()` callback. Effect registration now correctly rejects non-function arguments.
- **Test formatting**: All 7 test files reformatted.

## Build System

- **Dynamic version resolution**: `build-ssg.ts` now reads `deno.json` version from workspace packages instead of hardcoding `0.13.0` in importmap. Falls back to `0.14.1`.
- **`readWorkspacePackageVersion()`**: New utility function that resolves version from sibling package's `deno.json` for the importmap.json metadata.
- **`BuildSSGOptions.allowHeadExtrasScripts`**: New option to control whether scripts in `headExtras` are permitted.
- **SSG render pipeline**: `ssg-render.ts` now accepts `root` property (previously derived from ctx only). Console error output truncated to first 3 lines.

## Infrastructure

- **CI workflows**: Lint workflow unblocked (was skipping `www/` due to Deno fmt panic on HTML tagged templates — no longer an issue). Publish workflow properly orders all 10 packages.
- **E2E tests**: Playwright config updated — new test file for theme system, accessibility-performance test for color contrast. Viewport set to 1280x720.
- **Color tokens**: Gray scale values (`--gray-0` through `--gray-12`) inlined in `generateRootColorCSS()` so they resolve immediately without waiting for OpenProps CDN.

## Website

- **Homepage**: `less-term` island CSS reformatted (expanded single-line to multi-line). Minor style fixes.
- **404 page**: Mobile responsive fix.
- **Guides**: Updated references in architecture, getting-started, and RPC pages.
- **Blog posts**: Updated old posts referencing deprecated package names.
- **Changelog page**: Router update for better mobile layout.
