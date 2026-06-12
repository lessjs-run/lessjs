# v0.39.0 Test Matrix

| Area                   | Command / Evidence              | Required |
| ---------------------- | ------------------------------- | -------- |
| Workflow               | `deno task workflow:check`      | Yes      |
| Package graph          | `deno task graph:check`         | Yes      |
| Architecture           | `deno task arch:check`          | Yes      |
| Public docs integrity  | `deno task docs:check-public`   | Yes      |
| Docs current           | `deno task docs:check-current`  | Yes      |
| Docs strategy          | `deno task docs:check-strategy` | Yes      |
| Format                 | `deno task fmt:check`           | Yes      |
| Lint                   | `deno task lint`                | Yes      |
| Typecheck              | `deno task typecheck`           | Yes      |
| Unit/integration tests | `deno task test`                | Yes      |
| Browser E2E            | `deno task test:e2e`            | Yes      |
| Build                  | `deno task build`               | Yes      |
| DSD report             | `deno task dsd:check-report`    | Yes      |
| Generated consumer     | `deno task consumer:local`      | Yes      |
| Publish dry-run        | `deno task publish:dry-run`     | Yes      |
| JSR publish            | local or CI publish success     | Yes      |
