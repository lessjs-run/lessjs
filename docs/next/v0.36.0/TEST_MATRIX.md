# v0.36.0 Test Matrix

## Unit Tests

| Module              | File                                                   | Coverage                        |
| ------------------- | ------------------------------------------------------ | ------------------------------- |
| ErrorBoundary retry | `packages/core/__tests__/error-boundary-retry.test.ts` | retry count, max retries, reset |
| FileIsrCache        | `packages/core/__tests__/file-isr-cache.test.ts`       | get/set/delete, TTL, stale      |
| @openelement/ssg    | `packages/ssg/__tests__/`                              | build, render, postprocess      |
| Parallel SSG        | `packages/ssg/__tests__/parallel.test.ts`              | worker distribution             |

## E2E Tests

| Browser         | Config                         | Status   |
| --------------- | ------------------------------ | -------- |
| Chromium        | `www/e2e/playwright.config.ts` | Existing |
| Firefox         | `www/e2e/playwright.config.ts` | New      |
| WebKit (Safari) | `www/e2e/playwright.config.ts` | New      |

## Local Gates (must all pass)

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task graph:check
deno task test
deno task build
deno task autoflow:check
```

## Browser Proof

All E2E tests must pass on Chromium + Firefox + WebKit.
