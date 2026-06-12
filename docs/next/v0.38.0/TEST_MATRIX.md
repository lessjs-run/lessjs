# v0.38.0 Test Matrix

## Local Gates

| Gate                            | Purpose                                   | Status                         |
| ------------------------------- | ----------------------------------------- | ------------------------------ |
| `deno task workflow:check`      | Active execution package shape            | Passed locally, 2026-06-12     |
| `deno task graph:check`         | Package graph and internal version ranges | Passed locally, 2026-06-12     |
| `deno task arch:check`          | Architecture contract                     | Passed locally, 2026-06-12     |
| `deno task docs:check-current`  | Current docs avoid legacy claims          | Passed locally, 2026-06-12     |
| `deno task docs:check-strategy` | Strategic docs anchors                    | Passed locally, 2026-06-12     |
| `deno task fmt:check`           | Formatting                                | Passed locally, 2026-06-12     |
| `deno task lint`                | Lint                                      | Passed locally, 2026-06-12     |
| `deno task typecheck`           | Typecheck                                 | Passed locally, 2026-06-12     |
| `deno task test`                | Unit/integration tests                    | Passed locally, 2026-06-12     |
| `deno task test:e2e`            | Chromium E2E gate                         | 102 passed locally, 2026-06-12 |
| `deno task build`               | Website/build proof                       | Passed locally, 2026-06-12     |
| `deno task dsd:check-report`    | DSD report gate                           | Passed locally, 2026-06-12     |
| `deno task publish:dry-run`     | Publishability before release             | Passed locally, 2026-06-12     |

## Additional Proof

- Package/subpath inventory report recorded in
  `docs/next/v0.38.0/PACKAGE_SURFACE_INVENTORY.md`.
- Public docs import-path scan reconciled through website docs, package
  READMEs, and create templates.
- Create-template generated surface narrowed in `packages/create/cli.ts`.
- Consumer smoke against the reset surface passed locally with
  `deno task consumer:local`, 2026-06-12.

## CI Gates

- `dev` non-JSR CI passed for `ef072a7b` on 2026-06-12:
  Lint & Format, CodeQL, Test, and SOP Gate.
- `main` non-JSR CI must pass before tag/release.
- JSR publish workflow is best-effort telemetry only.
