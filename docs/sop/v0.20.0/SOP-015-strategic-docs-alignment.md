# SOP-015: Strategic Docs Alignment

> ADR: [ADR-0037 DSD-First Strategic Boundary](../../adr/0037-dsd-first-strategic-boundary.md)
> Depends on: SOP-014 Repository Cleanup Gate Hardening
> Estimated time: 0.5-1 day
> Complexity: Medium

---

## Objective

Align the repository docs and public website with the actual v0.20.0 state:

- v0.20.0 delivered Ocean-Island Architecture and cleanup gate hardening.
- The strongest current product center is DSD-first Web Components rendering.
- SSG is the current production rendering mode.
- Hydration strategies, ISR, request-time SSR, and mature Hub ecosystem growth
  remain roadmap work.

This SOP prevents stale v0.18/v0.19 public claims from reappearing after
future reviews or generated-doc updates.

---

## Scope

### In scope

- `README.md`
- `README.en.md`
- `docs/adr/README.md`
- `docs/roadmap/ROADMAP.md`
- `docs/status/STATUS.md`
- `docs/changelog/README.md`
- `docs/changelog/v0.20.0.md`
- `docs/sop/v0.20.0/README.md`
- `www/app/routes/index/index.ts`
- `www/app/routes/guide/positioning.ts`
- `www/app/routes/engine/architecture.ts`
- `www/app/routes/engine/comparison.ts`
- `www/app/routes/engine/islands.ts`
- `www/app/routes/roadmap.ts`

### Out of scope

- Changing package versions or publishing packages.
- Implementing hydration strategies, ISR, or request-time SSR.
- Changing runtime code outside docs routes.
- Rewriting historical ADRs, old review reports, or old changelog entries.

---

## Canonical Claims

Use these exact claim boundaries across public docs:

| Topic            | Allowed current claim                             | Must not claim yet                    |
| ---------------- | ------------------------------------------------- | ------------------------------------- |
| Product identity | DSD-first WC application framework                | Mature generic full-stack framework   |
| Rendering mode   | SSG is production-ready                           | ISR/SSR are shipped                   |
| Components       | DsdElement is the DSD base                        | All islands are framework-free        |
| Hydration        | Binary island upgrade exists; directives are next | `client:*` directives are complete    |
| Registry Hub     | Evidence pipeline and early-access index          | Mature marketplace                    |
| Third-party WC   | Deterministic SSR/client-only/reject outcomes     | Universal automatic SSR               |
| Full-stack       | Routes, Hono API routes, dev/build pipeline       | Auth, DB, request context, ISR parity |

---

## Procedure

1. Read ADR-0037 and confirm the target version line.
2. Run `git status --short` and verify whether the worktree is clean.
3. Search public docs for stale version/status phrases:
   - `v0.18.0`
   - `v0.18.1`
   - `v0.19.0`
   - `Current`
   - `planned for v0.20`
   - `Infinity`
   - old test counts such as `681` or `734`
4. Update README files first because they are the public root.
5. Update `docs/roadmap/ROADMAP.md` and `docs/status/STATUS.md` as the
   planning and operator truth files.
6. Update website route pages that repeat root claims:
   - homepage stats and hero copy
   - positioning page
   - architecture page
   - comparison page
   - island guide examples
   - roadmap page
7. Update indexes:
   - ADR index includes ADR-0036 and ADR-0037.
   - v0.20 SOP index includes SOP-015.
   - changelog index includes v0.20.0.
8. Add a changelog note under v0.20.0 describing the docs alignment.
9. Run verification commands.

---

## Verification Checklist

- [ ] `deno task fmt:check`
- [ ] `deno task docs:check-strategy`
- [ ] `deno task typecheck`
- [ ] `deno task build`
- [ ] `deno task dsd:check-report`
- [ ] `git status --short`

For a docs-only update, `lint`, full tests, and e2e are recommended before
release closure but not mandatory for this SOP unless source routes changed in
a way that could affect rendering. Because this SOP updates `www/app/routes`,
run `typecheck` and `build` at minimum.

---

## Acceptance Criteria

- README and website no longer present v0.18/v0.19 as current.
- v0.20.0 is described as Ocean-Island / DSD-native UI work, not future work.
- v0.21.x is the next Hydration + ISR line.
- Package-version skew is acknowledged as staggered package release state.
- Public docs distinguish shipped SSG from planned ISR/SSR.
- Public roadmap reflects ADR-0037.
- No historical review or ADR content is rewritten just to update old context.
