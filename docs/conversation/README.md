# docs/conversation/

Detailed troubleshooting reports and incident postmortems.

## Naming Convention

Files are named by **problem**, not by date. This makes them searchable and
discoverable — when you encounter a similar error, the filename tells you
whether a prior investigation exists.

**Pattern**: `{short-problem-description}.md`

Examples:

- `ssr-island-extends-undefined.md` — `class extends undefined` crash in SSR
- `vite-module-graph-cycle.md` — circular import causing build hangs
- `jsr-publish-token-expiry.md` — JSR publish failure due to expired token

**Avoid**: Date-prefixed names like `2026-05-16-showcase-ssr-fix.md` — the date
is available via `git log`, and date prefixes make it hard to find past issues
by symptom.

## Structure

Each report should include:

1. **Problem**: One-sentence summary with the error message or symptom
2. **Date**: When the issue was discovered
3. **Status**: Fixed / Open / Wontfix
4. **Root Cause**: Why it happened
5. **Fix**: What was changed
6. **Verification**: How it was confirmed fixed
7. **Key Lesson**: What to remember for next time
