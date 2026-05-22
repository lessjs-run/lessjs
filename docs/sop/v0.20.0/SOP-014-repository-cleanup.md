# SOP-014: Repository Cleanup Gate Hardening

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Depends on**: SOP-011 (Build Verification), SOP-012 (Regression Testing), SOP-013 (Lit Cleanup)
> **Estimated time**: 0.5 day
> **Complexity**: Low

---

## Objective

Close the v0.20.0 cleanup loop after the Ocean-Island migration by removing
report-only cleanup debt and making repository health checks enforceable.

This SOP intentionally avoids large architecture refactors. It focuses on
low-risk cleanup that protects the already-migrated DSD surface:

1. Replace report-only DSD compatibility checks with a real gate.
2. Keep known third-party SSR errors isolated from new regressions.
3. Add focused tests around cleanup policy.
4. Record the cleanup in the v0.20 changelog.

---

## Scope

### In scope

- `packages/hub/src/cli/dsd-report-gate.ts`
- `packages/hub/__tests__/`
- `docs/changelog/v0.20.0.md`
- SOP index updates under `docs/sop/v0.20.0/`

### Out of scope

- Splitting large modules such as `less-layout.ts`, `types.ts`, or
  `adapter-vite/src/index.ts`.
- Deleting historical review documents.
- Changing Shoelace SSR compatibility behavior.
- Changing public component APIs.

---

## Cleanup Policy

### DSD report gate

The DSD report gate must fail on unexpected new error classes. Known
third-party client-only SSR patterns may remain allowlisted, but the allowlist
must be explicit and tested.

Default v0.20 thresholds:

| Threshold                     | Default | Reason                                      |
| ----------------------------- | ------- | ------------------------------------------- |
| Non-recoverable errors        | 6       | Current v0.20 baseline; no new hard errors. |
| Unknown error message classes | 0       | New error classes require triage.           |

Temporary local overrides are allowed only for investigation:

```bash
LESSJS_DSD_MAX_NON_RECOVERABLE=10 deno task dsd:check-report
LESSJS_DSD_MAX_UNKNOWN_ERROR_TYPES=1 deno task dsd:check-report
```

Do not commit relaxed thresholds.

---

## Procedure

1. Inspect `www/dist/dsd-report.json` after a fresh build.
2. Count total, recoverable, and non-recoverable errors.
3. Group errors by message and classify each class as known or unknown.
4. Fail when non-recoverable errors exceed the v0.20 baseline.
5. Fail when any unknown error class appears.
6. Add unit tests for pass, unknown-error failure, and non-recoverable threshold
   failure.
7. Run formatting, linting, typecheck, tests, build, e2e tests, audit, and the
   DSD report gate.
8. Update the v0.20 changelog with the cleanup result.

---

## Verification Checklist

- [ ] `deno task fmt:check`
- [ ] `deno task lint`
- [ ] `deno task typecheck`
- [ ] `deno task test`
- [ ] `deno task build`
- [ ] `deno task test:e2e`
- [ ] `deno audit`
- [ ] `deno task dsd:check-report`

---

## Follow-up Cleanup Candidates

These are intentionally deferred to future SOPs because they require larger
module-boundary work:

- Split `packages/ui/src/less-layout.ts` into render and navigation helpers.
- Split `packages/core/src/types.ts` by public contract area.
- Split `packages/adapter-vite/src/index.ts` orchestration from plugin policy.
- Move generated registry data away from route-adjacent handwritten source.
- Split broad UI component tests into component-focused files.
