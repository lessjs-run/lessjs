# SOP-006: Docs Governance and Open Source Positioning

> Version: v0.23.0\
> Priority: P1\
> Status: IMPLEMENTED\
> Depends on: ADR-0050

## Objective

Keep public project claims aligned with verified package behavior and make the
architecture understandable to contributors.

## Current Problem

LessJS documentation has high-quality ADR/SOP history, but current-version
claims can drift:

- status docs can lag package versions;
- README package descriptions can lag extracted ownership;
- roadmap version names can keep old plans after architecture priorities move;
- changelog claims can overstate consumer import cleanup;
- generated project behavior can be more authoritative than prose.

For an open source framework, this is not just documentation polish. It affects
trust and contributor decision-making.

## Target Contract

Public docs should answer these questions consistently:

- What is the current version line?
- What is shipped versus planned?
- Which package owns each concept?
- Which imports should ordinary users write?
- Which APIs are compatibility bridges?
- Which gates prove a release?
- Which package should a new contributor edit for a given concern?

## Procedure

### Step 1: Define Docs Sources of Truth

- [ ] `docs/status/STATUS.md` owns current line and verified status.
- [ ] `docs/roadmap/ROADMAP.md` owns version order.
- [ ] ADRs own irreversible architecture decisions.
- [ ] SOPs own execution steps and gates.
- [ ] Changelog owns package/user-facing changes.
- [ ] README owns public positioning and quickstart.

Acceptance:

- [ ] No document contradicts another on current version line.

### Step 2: Update Package Role Language

- [ ] Describe `@lessjs/core` as runtime kernel.
- [ ] Describe `@lessjs/signals` as facade over `alien-signals`.
- [ ] Describe `@lessjs/app` as configuration facade.
- [ ] Describe any authoring facade separately if introduced.
- [ ] Mark compatibility bridges where needed.
- [ ] Describe `@lessjs/adapter-vite` as the Vite/SSG adapter, not the owner of
      all build-time concepts.
- [ ] Describe `@lessjs/content` and `@lessjs/i18n` as feature packages that
      consume shared build contracts.

Acceptance:

- [ ] Package descriptions match code ownership.
- [ ] README and package READMEs use the same ownership language.

### Step 3: Keep Roadmap Conservative

- [ ] Do not claim Edge Full-Stack until ISR production handler and KV adapters
      exist and pass gates.
- [ ] Do not claim mature Hub marketplace until real package evidence exists.
- [ ] Keep DSD-first and static-first as the product center.

Acceptance:

- [ ] Version plans are ambitious but falsifiable.

### Step 4: Add Consistency Checks

- [ ] Add or extend docs checks for roadmap/status/current version agreement.
- [ ] Check ADR index includes newly accepted ADRs.
- [ ] Check SOP index includes active version directories.
- [ ] Check README current line does not lag status.
- [ ] Check changelog and package versions agree during release prep.
- [ ] Check docs do not describe deferred v0.24 Edge work as shipped v0.23
      behavior.

Acceptance:

- [ ] Docs drift becomes a CI failure where practical.

### Step 5: Maintain Contributor Orientation

- [ ] Add a package ownership table to the public docs or contributor docs.
- [ ] Link ADR-0050 from roadmap, status, SOP index, and contributor-facing
      architecture docs.
- [ ] Keep shipped/planned/deferred labels visible for architecture work.

Acceptance:

- [ ] A contributor can identify the right package before opening code.
- [ ] Deferred features do not appear as release promises.

## Verification

```sh
deno task docs:check-strategy
deno task fmt:check
deno task typecheck
```

## Exit Criteria

- Open source readers can understand the package architecture without reading
  the entire monorepo.
- Docs distinguish shipped behavior, planned architecture, and deferred
  ambition.
- The current version story is consistent across README, status, roadmap, ADR,
  SOP, and changelog.

## v0.23.0 Result

- `docs/arch/` describes the current layered package architecture.
- README, status, roadmap, SOPs, and changelog identify v0.23.0 as the active
  implemented architecture line.
- v0.24 remains the deferred Edge Full-Stack line; ISR production handlers and
  KV adapters are not claimed as v0.23 behavior.
- `docs/changelog/v0.23.0.md` records the breaking ownership moves and release
  gates.
