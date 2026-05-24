# SOP-009: Hub Evidence and Trust Pipeline

Status: planned\
Target version: v0.21.4\
Owner: hub package and registry docs

## Objective

Make Registry Hub credible as ecosystem infrastructure. It should be evidence-driven, schema-validated, and conservative about trust.

## Evidence Inputs

- `packages/hub/src/`
- `packages/hub/src/scanner.ts`
- `packages/hub/src/snapshot-playwright.ts`
- `registry/` or package index data
- manifest validation tests
- `docs/sop/v0.22.0/`

## Problem Statement

Hub can become a durable moat only if it is more than a directory of packages. It needs trustworthy admission:

- schema validation;
- package metadata checks;
- DSD/browser evidence where possible;
- manifest hashing;
- deterministic index generation;
- clear rejection reasons;
- no network or environment flakiness hidden in green gates.

## Scope

Harden:

- manifest schema validation;
- strict hub validation;
- index generation;
- Playwright snapshot behavior;
- package evidence records;
- trust/rejection report output;
- docs for package authors.

## Procedure

1. Inventory current Hub schema and validation commands.
2. Define required evidence for a package:
   - manifest fields;
   - package source or registry URL;
   - component tags;
   - DSD compatibility status;
   - browser snapshot status where available;
   - hash or integrity metadata.
3. Make `hub:validate --strict --json` produce actionable failures.
4. Make `hub:check-index` deterministic.
5. Add tests for malformed packages, missing evidence, and stale index entries.
6. Document what Hub does not guarantee.

## Trust Rules

- Hub validation is not a security audit.
- A passing package is compatible evidence, not a blanket endorsement.
- Network-dependent checks must be isolated or cached intentionally.
- Rejections must be reproducible from local commands.
- Any package score or label must state the evidence behind it.

## API Design Rules

- Prefer versioned schemas over loose object evolution.
- Do not mix package discovery with runtime component loading.
- Do not make Hub mandatory for local components.
- Keep trust reports machine-readable and human-readable.

## Acceptance Criteria

- Strict Hub validation emits clear JSON with stable fields.
- Index checks fail on stale or inconsistent package data.
- At least one negative fixture proves rejection behavior.
- Docs explain the trust model and non-guarantees.
- Hub output can be referenced by v0.22.0 ecosystem/deployment docs without overstating safety.

## Validation Commands

```powershell
git status --short --branch
deno task fmt:check
deno task lint
deno task typecheck
deno task hub:validate --strict --json
deno task hub:check-index
deno task test
git status --short --branch
```

## Exit Decision

Proceed to SOP-010 when Hub is a conservative evidence pipeline rather than a marketing claim.
