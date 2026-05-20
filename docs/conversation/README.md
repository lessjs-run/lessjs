# docs/conversation/

Detailed troubleshooting reports, audit notes, and incident postmortems.

## Naming Convention

Files are named by **problem**, not by date. This makes them searchable and
discoverable: when you encounter a similar error, the filename tells you whether
a prior investigation exists.

**Pattern**: `{short-problem-description}.md`

Examples:

- `registry-hub-v019-audit-gaps.md` - v0.19 Registry Hub prototype gaps,
  release blockers, and validation checklist
- `ssr-island-extends-undefined.md` - `class extends undefined` crash in SSR
- `sw-crash-package-ssr-admission.md` - service worker crash and package SSR
  admission boundary
- `vanilla-adapter-render-fallback.md` - vanilla adapter `ssr: false` blank
  rendering and Shoelace color contrast
- `vite-module-graph-cycle.md` - circular import causing build hangs
- `jsr-publish-token-expiry.md` - JSR publish failure due to expired token

## Subdirectories

- `www-redesign/` — 2026-05-19 www 全站重设计团队协作（PRD + 架构 + 技术债分析）

**Avoid**: Date-prefixed names like `2026-05-16-showcase-ssr-fix.md`. The date
is available via `git log`, and date prefixes make it hard to find past issues
by symptom.

## Structure

Each report should include:

1. **Problem**: One-sentence summary with the error message or symptom
2. **Date**: When the issue was discovered
3. **Status**: Fixed / Open / Wontfix
4. **Root Cause**: Why it happened
5. **Fix**: What was changed or what still needs to change
6. **Verification**: How it was confirmed fixed
7. **Key Lesson**: What to remember for next time
