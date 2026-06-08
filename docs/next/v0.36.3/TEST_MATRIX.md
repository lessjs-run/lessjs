# v0.36.3 Test Matrix

## Local Gates

| Gate                | Command                         | Expected        |
| ------------------- | ------------------------------- | --------------- |
| workflow:check      | `deno task workflow:check`      | Pass            |
| arch:check          | `deno task arch:check`          | Pass            |
| graph:check         | `deno task graph:check`         | Pass            |
| docs:check-current  | `deno task docs:check-current`  | Pass            |
| docs:check-strategy | `deno task docs:check-strategy` | Pass            |
| fmt:check           | `deno task fmt:check`           | Pass            |
| lint                | `deno task lint`                | Pass            |
| typecheck           | `deno task typecheck`           | Pass            |
| autoflow:test       | `deno task autoflow:test`       | Pass            |
| autoflow:health     | `deno task autoflow:health`     | Pass            |
| autoflow:check      | `deno task autoflow:check`      | Pass            |
| test                | `deno task test`                | Pass            |
| build               | `deno task build`               | Pass            |
| dsd:check-report    | `deno task dsd:check-report`    | Pass            |
| publish:dry-run     | `deno task publish:dry-run`     | Pass            |
| test:e2e            | `deno task test:e2e`            | Pass (Chromium) |

## Package-Specific Tests

| Package      | Test Command                                 | Purpose                      |
| ------------ | -------------------------------------------- | ---------------------------- |
| ssg          | TBD                                          | Independent SSG engine tests |
| adapter-vite | `deno test packages/adapter-vite/__tests__/` | Bridge works after migration |

## CI Jobs

| Job               | Workflow      | Status Target |
| ----------------- | ------------- | ------------- |
| lint              | Lint & Format | Green         |
| test-core         | Test          | Green         |
| test-adapter-vite | Test          | Green         |
| build-www         | Test          | Green         |
| test-e2e          | Test          | Green         |
| coverage          | Test          | Green         |
