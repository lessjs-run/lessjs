# v0.34.0 Tasks

## S1: Scaffold

- [ ] Create `tools/autoflow/` directory structure.
- [ ] Create `tools/autoflow/mod.ts` CLI entry.
- [ ] Create `tools/autoflow/__tests__/` directory.
- [ ] Add `deno task autoflow:report` to `deno.json`.
- [ ] Verify `deno task autoflow:report` runs without error (stub).

## S2: State Machine

- [ ] Implement `state-machine.ts`: enum + transition table.
- [ ] States: `planned`, `next`, `active`, `implemented`, `released`, `drifted`.
- [ ] Legal transitions: `planned→next`, `next→active`, `active→implemented`,
      `implemented→released`, `*→drifted`.
- [ ] Export `determineState(evidence) => WorkflowState`.
- [ ] Unit tests: all legal transitions, all illegal transitions rejected,
      drifted detection.

## S3: Cells

- [ ] Implement `cells.ts`: Cell name enum + status enum.
- [ ] Statuses: `ok`, `warning`, `missing`, `drifted`.
- [ ] Define 9 cell names with metadata (label, description).
- [ ] Export `createCell(name, status, detail, source) => Cell`.
- [ ] Unit tests: cell creation, status string representation.

## S4: Readers

### S4a: status reader

- [ ] Implement `readers/status.ts`.
- [ ] Parse current version line from `STATUS.md`.
- [ ] Extract active NextVersion path.
- [ ] Extract gate order list.
- [ ] Unit tests with STATUS.md snapshot.

### S4b: sop reader

- [ ] Implement `readers/sop.ts`.
- [ ] Parse SOP status header.
- [ ] Count `[x]` vs `[ ]` tasks.
- [ ] Unit tests with SOP snapshot.

### S4c: nextversion reader

- [ ] Implement `readers/nextversion.ts`.
- [ ] Check 8 required files exist and are non-empty.
- [ ] Unit tests with fixture directories.

### S4d: roadmap reader

- [ ] Implement `readers/roadmap.ts`.
- [ ] Parse version sequence from ROADMAP.md.
- [ ] Compare current version with roadmap position.
- [ ] Unit tests.

### S4e: package-graph reader

- [ ] Implement `readers/package-graph.ts`.
- [ ] Read `deno.json` workspace config.
- [ ] Read each package's `deno.json` version.
- [ ] Report version alignment.
- [ ] Unit tests with fixture workspace.

### S4f: adr reader

- [ ] Implement `readers/adr.ts`.
- [ ] Scan `docs/adr/` for ADR files.
- [ ] Extract status (Accepted/Proposed/Deprecated) and linked SOP.
- [ ] Unit tests.

## S5: Reporter

- [ ] Implement `reporter.ts`.
- [ ] `reportJson(cells, state) => ReportJson` — structured JSON output.
- [ ] `reportSummary(cells, state) => string` — Markdown summary block.
- [ ] Unit tests: JSON schema validation, summary format.

## S6: CLI Entry

- [ ] Wire `mod.ts`: parse `--json` / `--summary` flags.
- [ ] Default to summary mode.
- [ ] Read `docs/status/STATUS.md` to determine active version.
- [ ] Run all readers, aggregate cells.
- [ ] Run state machine, output report.
- [ ] Integration test: run against real repo, verify non-empty output.

## S7: Fixtures

- [ ] Create `fixtures/released/` — complete released-version snapshot.
- [ ] Create `fixtures/active/` — in-progress version snapshot.
- [ ] Create `fixtures/planned/` — planned-only, no NextVersion.
- [ ] Create `fixtures/drifted/` — version mismatch between STATUS and packages.
- [ ] Create `fixtures/invalid/` — missing critical files.

Each fixture is a minimal directory tree that triggers a specific workflow state.

## S8: Snapshot Tests

- [ ] Implement `__tests__/integration.test.ts`.
- [ ] For each fixture: run full pipeline → compare to snapshot.
- [ ] Use `deno test --update` to generate initial snapshots.
- [ ] Test that drift fixture reports `drifted` state.
- [ ] Test that invalid fixture reports `invalid` state.
- [ ] Test that released fixture reports `released` state.

## S9: Docs and Release

- [ ] Update `docs/sop/v0.34.0/README.md` status to Active.
- [ ] Update `docs/status/STATUS.md`: v0.34 → Current, v0.33 → historical.
- [ ] Update `docs/roadmap/ROADMAP.md`.
- [ ] Update `docs/arch/current-architecture.md` with autoflow layer.
- [ ] Write CHANGELOG entry.
- [ ] Write `docs/release/v0.34.0.md` release note.
- [ ] Update `README.md` with `deno task autoflow:report`.
- [ ] Ensure all existing gates still pass.
