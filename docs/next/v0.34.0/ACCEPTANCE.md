# v0.34.0 Acceptance Criteria

v0.34.0 is accepted only if all criteria below are satisfied.

## Product Criteria

- `deno task autoflow:report` runs against the real repository and emits valid
  JSON and Markdown summary.
- The report identifies the current workflow state, all 9 cells, blockers,
  and allowed actions.
- Each cell has a status (`ok`, `warning`, `missing`, `drifted`) and a human-
  readable detail string.
- The report does not access network, call git, or modify any files.
- The report works with `--json` and `--summary` output modes.

## Architecture Criteria

- All readers are pure functions: `(rootDir: string) => StructuredData`.
- State machine has exactly 6 states and only legal transitions are permitted.
- No code in `tools/autoflow/` imports from `packages/`.
- No `deno task autoflow:check` exists or is registered as a gate.
- Existing gates (`workflow:check`, `fmt`, `lint`, `typecheck`, `test`,
  `graph:check`, `arch:check`) all still pass.

## Evidence Criteria

- State machine unit tests cover all legal and illegal transitions.
- Each reader has unit tests against snapshot data.
- 5 fixture directories produce correct workflow states.
- Integration test processes each fixture end-to-end and matches snapshots.
- Snapshot tests pass after `deno test --update`.
- AutoFlow tests are discoverable via `deno test` in `tools/autoflow/`.

## Non-Goals Verified

- [ ] No `autoflow:check` gate in CI config.
- [ ] No code that calls `git`, `gh`, or any external process.
- [ ] No file writes beyond test snapshots.
- [ ] No network access (`--allow-read` only).
