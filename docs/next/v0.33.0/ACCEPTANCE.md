# v0.33.0 Acceptance Criteria

v0.33.0 is accepted only if all criteria below are satisfied.

## Product Criteria

- New docs and create templates use only object-form `definePage({ ... })`.
- Page descriptors expose structured `head`, `route`, and `renderIntent` intent.
- Island metadata uses `export const openElement = defineIslandConfig(...)`.
- App-level island options expose `ssr?: boolean`.
- Raw head insertion uses `head.dangerouslyHeadFragments`.
- Old v0.31-v0.32 page function-form and island object-literal metadata are rejected.

## Architecture Criteria

- Generated entry code reads page `head` and `renderIntent`, not old top-level
  page shortcut fields.
- Adapter island scanning accepts only `defineIslandConfig(...)`.
- Generated entries remain declarative wiring.
- The renderer remains JSX -> VNode -> RenderNode -> DSD HTML or DOM.
- No AutoFlow2 runtime code is required for v0.33.

## Evidence Criteria

- Unit tests cover new page fields and old API rejection.
- Unit tests cover island metadata helper and `ssr?: boolean`.
- Generated-entry tests prove the new descriptor feeds lifecycle metadata.
- Create-template tests prove generated projects use the new docs path and
  still build.
- Docs gates pass.
- Architecture and package graph gates pass.
- Full local tests pass before package bump.
- Changelog and release note are written after implementation proof.

## Evidence Record (2026-06-06)

All acceptance criteria are satisfied. Implementation gates:

| Gate                  | Result                      |
| --------------------- | --------------------------- |
| `fmt`                 | 815 files ✅                |
| `lint`                | 288 files ✅                |
| `typecheck`           | all packages ✅             |
| `test`                | 1314 passed, 0 failed ✅    |
| `graph:check`         | 19 packages, 0 cycles ✅    |
| `arch:check`          | 1007 tracked files ✅       |
| `workflow:check`      | passed for v0.33.0 ✅       |
| `docs:check-current`  | no legacy API references ✅ |
| `docs:check-strategy` | 5 checks, 31 files ✅       |
| `dsd:check-report`    | 0 errors ✅                 |
| `publish:dry-run`     | 19 packages ✅              |
| `consumer:local`      | build passed ✅             |

Release artifacts:

- CHANGELOG entry written
- `docs/release/v0.33.0.md` written
- STATUS.md updated to v0.33.0
- www homepage and Getting Started updated
- Roadmap page updated
- RELEASE_CHECKLIST.md updated
- TASKS.md checked off
