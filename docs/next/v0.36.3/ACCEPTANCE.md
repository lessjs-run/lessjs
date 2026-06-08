# v0.36.3 Acceptance Criteria

## Exit Criteria

1. **File ownership**: All 10 SSG modules moved from `adapter-vite/src/` to `ssg/src/`
2. **Imports updated**: adapter-vite imports SSG logic from `@openelement/ssg`
3. **Compatibility**: adapter-vite re-exports from `@openelement/ssg` (no breaking changes)
4. **Independent SSG**: `@openelement/ssg` works as a standalone package
5. **Build unchanged**: Root `deno task build` produces identical output
6. **All gates pass**: `deno task gate` passes with 12/12 checks
7. **E2E passes**: `deno task test:e2e` (Chromium) passes
8. **No dead code**: Removed source files are cleaned up, not left as stubs

## Evidence Requirements

- Cell events recorded in `docs/autoflow/cells/cell-v0.36.3-*/`
- Updated STATUS.md declaring v0.36.3 as active
- Updated ROADMAP.md showing v0.36.3 as Done
- Changelog at `docs/changelog/v0.36.3.md`
- Release note at `docs/release/v0.36.3.md`
