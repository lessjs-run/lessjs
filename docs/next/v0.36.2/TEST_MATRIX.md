# v0.36.2 Test Matrix

## Focused Evidence

| Area                           | Command                                                                                                                                                                          | Expected                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| SSG package render/postprocess | `deno test --allow-read --allow-write --allow-env --allow-net --allow-run packages/ssg/__tests__/`                                                                               | SSG render and postprocess tests pass  |
| Adapter bridge                 | `deno test --allow-read --allow-write --allow-env --allow-net --allow-run packages/adapter-vite/__tests__/ssg-bridge.test.ts packages/adapter-vite/__tests__/ssg-render.test.ts` | Compatibility exports and wrapper pass |
| ISR cache                      | `deno test --allow-read --allow-write --allow-env --allow-net --allow-run packages/core/__tests__/isr.test.ts`                                                                   | Memory and file cache tests pass       |
| Streaming DSD                  | `deno test --allow-read --allow-write --allow-env --allow-net --allow-run packages/core/__tests__/streaming-dsd.test.ts`                                                         | Stream and Web Response tests pass     |

Focused command already used during implementation:

```bash
deno test --allow-read --allow-write --allow-env --allow-net --allow-run packages/ssg/__tests__/ packages/core/__tests__/isr.test.ts packages/core/__tests__/streaming-dsd.test.ts packages/adapter-vite/__tests__/ssg-bridge.test.ts packages/adapter-vite/__tests__/ssg-render.test.ts
```

## Release Gates

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task graph:check
deno task autoflow:test
deno task autoflow:health
deno task autoflow:check
deno task test
deno task build
deno task dsd:check-report
deno task publish:dry-run
deno task test:e2e
```

## Browser Scope

Chromium E2E remains the required local browser gate. Firefox/WebKit expansion
is only claimed if the full browser setup and test execution pass. Otherwise it
is recorded as a v0.37 blocker.
