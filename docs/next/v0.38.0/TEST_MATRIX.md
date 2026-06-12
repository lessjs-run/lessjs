# v0.38.0 Test Matrix

## Local Gates

| Gate                            | Purpose                                   | Status  |
| ------------------------------- | ----------------------------------------- | ------- |
| `deno task workflow:check`      | Active execution package shape            | Pending |
| `deno task graph:check`         | Package graph and internal version ranges | Pending |
| `deno task arch:check`          | Architecture contract                     | Pending |
| `deno task docs:check-current`  | Current docs avoid legacy claims          | Pending |
| `deno task docs:check-strategy` | Strategic docs anchors                    | Pending |
| `deno task fmt:check`           | Formatting                                | Pending |
| `deno task lint`                | Lint                                      | Pending |
| `deno task typecheck`           | Typecheck                                 | Pending |
| `deno task test`                | Unit/integration tests                    | Pending |
| `deno task test:e2e`            | Chromium E2E gate                         | Pending |
| `deno task build`               | Website/build proof                       | Pending |
| `deno task dsd:check-report`    | DSD report gate                           | Pending |
| `deno task publish:dry-run`     | Publishability before release             | Pending |

## Additional Proof

- Package/subpath inventory report.
- Public docs import-path scan.
- Create-template generated project smoke.
- Consumer smoke against the reset surface.

## CI Gates

- `dev` non-JSR CI must pass before merge/sync to `main`.
- `main` non-JSR CI must pass before tag/release.
- JSR publish workflow is best-effort telemetry only.
