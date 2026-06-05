# v0.32.0 Test Matrix

## Local Gates

Run before package bump:

```bash
deno task workflow:check
deno task arch:check
deno task graph:check
deno task docs:check-current
deno task docs:check-strategy
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
```

Run after package bump and release docs:

```bash
deno task dsd:check-report
deno task publish:dry-run
deno task test:e2e
```

## Focused Fixtures

| Surface              | Required proof                                              |
| -------------------- | ----------------------------------------------------------- |
| `@openelement/app`   | `definePage()` context, error renderer, redirect, not-found |
| generated Hono entry | request-time lifecycle control and error rendering          |
| SSG `renderRoute()`  | structured routeInfo and lifecycle control output           |
| docs website         | current version, lifecycle guide, roadmap consistency       |

## CI

`dev` and `main` must pass:

- Lint & Format
- Test
- SOP Gate
- publish dry-run workflow where configured
