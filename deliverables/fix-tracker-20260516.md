# Fix Tracker — v0.14.10

> Date: 2026-05-16
> Target: All 22 issues from audit → v0.14.10 release
> Source audit: `deliverables/review260516/20260516-1-project-full-audit-bilingual.md`

## Batch 1: Security + Quick Wins (🔴 严重 + 🟡 快速项)

| ID | Severity | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| S1 | 🔴 | Replace regex sanitizer with `sanitize-html`; add XSS regression tests | `packages/content/src/blog/markdown.ts` | ✅ |
| H1 | 🟡 | Upgrade Hono to `4.12.18`; add `deno audit` to publish task | `deno.json`, `deno.lock` | ✅ |
| H3 | 🟡 | term API: add JSON try/catch + `typeof cmd` validation | `www/app/routes/api/term.ts` | ✅ |
| H4 | 🟡 | CORS: reject `'*' + credentials: true` at build time | `packages/adapter-vite/src/entry-renderer.ts` | ✅ |

## Batch 2: Build Pipeline Fixes (🔴 严重 + 🟡 构建相关)

| ID | Severity | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| S2 | 🔴 | Remove `_virtual_less-hono-entry*.js` from public dist | `packages/adapter-vite/src/build.ts` | ✅ |
| S3 | 🔴 | i18n: skip already-localized routes (no `/en/zh/`, `/zh/zh/`) | `packages/adapter-vite/src/cli/ssg-render.ts` | ✅ |
| H5 | 🟡 | FlexSearch: bundle locally via import map | `www/app/islands/less-search.ts`, `deno.json` | ✅ |
| G9 | 🟢 | Post-build size assertion (no Hono entry, islands < 200KB) | `www/__tests__/build-output.test.ts` | ✅ |

## Batch 3: Platform + Runtime Robustness (🟡 高危)

| ID | Severity | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| H2 | 🟡 | E2E: cross-platform Playwright command | `deno.json` | ✅ |
| H6 | 🟡 | Islands: add AbortController + cleanup (api-consumer, less-term, less-toc) | `www/app/islands/` | ✅ |

## Batch 4: Code Quality + Hygiene (🟢 一般)

| ID | Severity | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| G1 | 🟢 | Route formatting: format `api/term.ts`, gradually remove fmt exclude | `deno.json`, `www/app/routes/` | ⬜ partial (formatted term.ts, fmt exclude unchanged due to Deno panic) |
| G2 | 🟢 | Version sync: README/roadmap → 0.14.9 | `README.md`, `README.en.md`, `www/app/routes/roadmap.ts` | ✅ |
| G3 | 🟢 | DevTools: fix corrupted strings (鉁?→✓, 鈩?→⚠, 鈴?→🔧) | `packages/adapter-vite/src/devtools/index.ts` | ✅ |
| G4 | 🟢 | `theme-init.js`: wrap localStorage/matchMedia in try/catch | `www/public/theme-init.js` | ✅ |
| G5 | 🟢 | Nav scanner: replace regex JS→JSON with AST parse | `packages/content/src/nav/scanner.ts` | ⬜ deferred (requires ts-morph or restructure) |
| G6 | 🟢 | Remove unused root imports (ts-morph, tsx, entities) | `deno.json` | ✅ |
| G7 | 🟢 | less-code-block: add security comment for trusted-only innerHTML | `packages/ui/src/less-code-block.ts` | ✅ |
| G8 | 🟢 | DevTools: scan only on explicit toggle, not on open | `packages/adapter-vite/src/devtools/index.ts` | ✅ |
| G10 | 🟢 | Resolve adapter-vite ↔ content circular dependency | `packages/adapter-vite/src/entry-renderer.ts`, `packages/content/` | ⬜ deferred (requires package restructuring) |
| G11 | 🟢 | Extract shared term command handler | `www/app/routes/api/term.ts`, `functions/api/term.ts` | ⬜ deferred (requires shared module) |
| G12 | 🟢 | Tighten `no-explicit-any` lint rule per-file | `deno.json` | ⬜ deferred (requires file-by-file audit) |
| G13 | 🟢 | Add `deno audit` gate to CI workflow | `.github/workflows/test.yml` | ✅ |

## Progress

- Batch 1: 4/4 ✅
- Batch 2: 4/4 ✅
- Batch 3: 2/2 ✅
- Batch 4: 7/12 ✅ (5 deferred to next release)
- **Total: 17/22 ✅ (5 deferred)**

## Deferred Items (v0.14.11+)

| ID | Reason |
|----|--------|
| G1 | fmt exclude can't be removed until Deno fmt panic on route files is resolved |
| G5 | Requires ts-morph re-introduction or significant restructure of nav scanner |
| G10 | Requires extracting `@lessjs/build-types` or moving sitemap responsibility |
| G11 | Requires creating shared module between Cloudflare and Hono term APIs |
| G12 | Requires file-by-file audit of all `any` usages with per-file overrides |
