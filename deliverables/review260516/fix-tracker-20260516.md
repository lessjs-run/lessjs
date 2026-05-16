# Fix Tracker — v0.14.10

> Date: 2026-05-16
> Target: All 22 issues from audit → v0.14.10 release
> Source audit: `deliverables/review260516/20260516-1-project-full-audit-bilingual.md`
> Final: 17/22 completed, 5 deferred to v0.14.11+, 1 post-release hotfix (entities)

## Batch 1: Security + Quick Wins (🔴 严重 + 🟡 快速项)

| ID | Severity | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| S1 | 🔴 | Replace regex sanitizer with `sanitize-html`; add XSS regression tests | `packages/content/src/blog/markdown.ts`, `www/app/routes/blog/[slug].ts`, `www/app/routes/decisions/[slug].ts` | ✅ |
| H1 | 🟡 | Upgrade Hono to `4.12.18+`; add `deno audit` to publish task | `deno.json`, `deno.lock` | ✅ |
| H3 | 🟡 | term API: add JSON try/catch + `typeof cmd` validation | `www/app/routes/api/term.ts` | ✅ |
| H4 | 🟡 | CORS: reject `'*' + credentials: true` at build time | `packages/adapter-vite/src/entry-renderer.ts` | ✅ |

## Batch 2: Build Pipeline Fixes (🔴 严重 + 🟡 构建相关)

| ID | Severity | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| S2 | 🔴 | Remove `_virtual_less-hono-entry*.js` from public dist; use temp outDir | `packages/adapter-vite/src/build.ts`, `packages/adapter-vite/src/cli/build.ts` | ✅ |
| S3 | 🔴 | i18n: skip already-localized routes (no `/en/zh/`, `/zh/zh/`) | `packages/adapter-vite/src/cli/ssg-render.ts` | ✅ |
| H5 | 🟡 | FlexSearch: bundle locally via import map instead of `esm.sh` runtime import | `www/app/islands/less-search.ts`, `deno.json` | ✅ |
| G9 | 🟢 | Post-build size assertion (no Hono entry, islands < 200KB) | `www/__tests__/build-output.test.ts` | ✅ |

## Batch 3: Platform + Runtime Robustness (🟡 高危)

| ID | Severity | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| H2 | 🟡 | E2E: cross-platform Playwright command | `deno.json` | ✅ |
| H6 | 🟡 | Islands: add AbortController + cleanup (api-consumer, less-term, less-toc) | `www/app/islands/api-consumer.ts`, `www/app/islands/less-term.ts`, `www/app/islands/less-toc.ts` | ✅ |

## Batch 4: Code Quality + Hygiene (🟢 一般)

| ID | Severity | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| G1 | 🟢 | Route formatting: format `api/term.ts`, gradually remove fmt exclude | `deno.json`, `www/app/routes/` | ⏭️ v0.14.11 |
| G2 | 🟢 | Version sync: README/roadmap → packages version; add `verify:versions` task | `README.md`, `README.en.md`, `www/app/routes/roadmap.ts` | ✅ |
| G3 | 🟢 | DevTools: fix corrupted strings (鉁?→✓, 鈩?→⚠, 鈴?→🔧) | `packages/adapter-vite/src/devtools/index.ts` | ✅ |
| G4 | 🟢 | `theme-init.js`: wrap localStorage/matchMedia in try/catch | `www/public/theme-init.js` | ✅ |
| G5 | 🟢 | Nav scanner: replace regex JS→JSON with AST parse or simpler approach | `packages/content/src/nav/scanner.ts` | ⏭️ v0.14.11 |
| G6 | 🟢 | Remove unused root imports (ts-morph, tsx, entities) | `deno.json` | ✅* |
| G7 | 🟢 | less-code-block: add comment + test for trusted-only innerHTML | `packages/ui/src/less-code-block.ts` | ✅ |
| G8 | 🟢 | DevTools: scan only on explicit refresh, not on open | `packages/adapter-vite/src/devtools/index.ts` | ✅ |
| G10 | 🟢 | Resolve adapter-vite ↔ content circular dependency | `packages/adapter-vite/src/entry-renderer.ts`, `packages/content/` | ⏭️ v0.14.11 |
| G11 | 🟢 | Extract shared term command handler (deduplicate Cloudflare + Hono API) | `www/app/routes/api/term.ts`, `functions/api/term.ts` | ⏭️ v0.14.11 |
| G12 | 🟢 | Tighten `no-explicit-any` lint rule per-file instead of global exclude | `deno.json` | ⏭️ v0.14.11 |
| G13 | 🟢 | Add `deno audit` gate to CI publish workflow | `.github/workflows/test.yml` | ✅ |

\* G6: 移除了 `ts-morph` 和 `tsx`，但 `entities` 因 `parse5` 子路径依赖而必须恢复（见下方热修复）

## Post-Release Hotfix

| ID | Severity | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| entities | 🟠 | CI 构建失败：Rolldown 无法解析 `entities/lib/escape.js`（parse5 传递依赖） | `deno.json`, `packages/adapter-vite/src/cli/build-ssg.ts`, `packages/adapter-vite/__tests__/ssg-smoke.test.ts` | ✅ |

## Progress

- Batch 1: 4/4 ✅
- Batch 2: 4/4 ✅
- Batch 3: 2/2 ✅
- Batch 4: 7/12 ✅ (5 deferred)
- **Total: 17/22 ✅ + 1 hotfix = 18/22 resolved**
