# v0.36.4 Test Matrix

| Area               | Command                       | Expected Result                                                                   |
| ------------------ | ----------------------------- | --------------------------------------------------------------------------------- |
| Workflow package   | `deno task workflow:check`    | NextVersion package is complete                                                   |
| Formatting         | `deno task fmt:check`         | No formatting drift                                                               |
| Lint               | `deno task lint`              | No lint violations                                                                |
| Typecheck          | `deno task typecheck`         | Package entry points typecheck                                                    |
| Package graph      | `deno task graph:check`       | 20 packages aligned to v0.36.4                                                    |
| AutoFlow health    | `deno task autoflow:health`   | Current line reported as implemented                                              |
| AutoFlow invariant | `deno task autoflow:check`    | Release invariants pass                                                           |
| Unit tests         | `deno task test`              | Framework tests pass                                                              |
| Site build         | `deno task build`             | Docs site builds                                                                  |
| DSD report         | `deno task dsd:check-report`  | DSD conformance passes                                                            |
| Publish dry-run    | `deno task publish:dry-run`   | Publish order is valid                                                            |
| Chromium E2E       | `deno task test:e2e`          | Default browser proof passes                                                      |
| Cross-browser E2E  | `deno task test:e2e:browsers` | Chromium, Firefox, and WebKit proof passes or documented limitations are explicit |
