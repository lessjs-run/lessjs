# v0.36.5 Test Matrix

| Area             | Command                          | Expected Result                                |
| ---------------- | -------------------------------- | ---------------------------------------------- |
| Workflow package | `deno task workflow:check`       | Validates v0.36.5 required files and anchors   |
| Package graph    | `deno task graph:check`          | 20 packages aligned to v0.36.4                 |
| Architecture     | `deno task arch:check`           | No contract drift                              |
| Current docs     | `deno task docs:check-current`   | No legacy API references                       |
| Strategy docs    | `deno task docs:check-strategy`  | Strategic docs remain internally consistent    |
| Formatting       | `deno task fmt:check`            | No formatting drift                            |
| Lint             | `deno task lint`                 | No lint violations                             |
| Typecheck        | `deno task typecheck`            | All package entry points typecheck             |
| Security         | `deno audit`                     | No known dependency advisory failure           |
| Configs          | `deno task verify:configs`       | Package config templates remain aligned        |
| AutoFlow dev     | `deno task autoflow:check-dev`   | Development invariants pass                    |
| AutoFlow report  | `deno task autoflow:report:json` | Active package has no missing evidence blocker |
| Site build       | `deno task build`                | Public website builds                          |
| Browser proof    | `deno task test:e2e`             | Chromium docs-site workflows pass              |
