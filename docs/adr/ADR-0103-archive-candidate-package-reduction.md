# ADR-0103: Archive-Candidate Package Reduction

- Status: Accepted
- Date: 2026-06-13
- Target: v0.40.x
- Depends on: ADR-0101, ADR-0102

## Context

v0.40 classifies the current workspace packages into product-facing,
foundation, adapter, and archive-candidate groups. The archive-candidate group
is:

- `@openelement/hub`;
- `@openelement/cem`;
- `@openelement/compat-check`;
- `@openelement/rpc`.

These packages still exist in the release graph, but they are not first-run
products for the v1 path. Removing or merging packages is a package topology
change, so ADR-0101 requires ADR approval.

## Decision

Use a staged reduction instead of deleting all candidates in one commit.

### Stage 1: Freeze

- keep the packages publishable while v0.40 reshapes docs, gates, and product
  entry points;
- remove them from first-run docs;
- keep package-surface classification as the active truth;
- require explicit imports from advanced docs or historical references only.

### Stage 2: Merge or Retire

Prepare one follow-up implementation decision per candidate:

| Package                     | v0.40 decision                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `@openelement/hub`          | Freeze as historical tooling; remove active root data and PR submission paths first. |
| `@openelement/cem`          | Prefer merge into tooling or `@openelement/compat-check` if still needed.            |
| `@openelement/compat-check` | Prefer merge into tooling if it remains release-only validation.                     |
| `@openelement/rpc`          | Prefer retire unless an active Framework or Protocols consumer is proven.            |

### Stage 3: Package Graph Change

Only after Stage 2 has a concrete implementation patch:

- remove package directories or merge code;
- update root workspace and imports;
- update `RELEASE_PACKAGE_ORDER`;
- update `PACKAGE_COUNT`;
- update JSR publish tasks;
- add migration notes and release evidence.

## Non-Goals

- Do not physically delete all archive candidates in one step.
- Do not break existing JSR consumers without migration notes.
- Do not remove package graph checks.
- Do not remove Hub historical evidence.

## Consequences

### Positive

- The repository stops treating archive candidates as first-run products.
- Package reduction can happen with compatibility and release evidence.
- v1 package surface becomes smaller and more defensible.

### Negative

- The workspace still temporarily carries more packages than the v1 target.
- Release scripts must support the old graph until each package is retired.

## Acceptance

- Package surface checks identify the archive candidates.
- Hub submission workflow is not an active PR path.
- Active docs do not present archive candidates as product lines.
- Any physical removal patch updates graph, release order, publish tasks, docs,
  and migration notes together.
