# v0.33.0 Test Matrix

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
deno task consumer:local
deno task publish:dry-run
deno task test:e2e
```

## Focused Fixtures

| Surface            | Required proof                                                  |
| ------------------ | --------------------------------------------------------------- |
| `@openelement/app` | object-form page fields, old page rejection, lifecycle output   |
| head metadata      | structured head, trusted/raw boundary, generated serialization  |
| island metadata    | helper config, old metadata rejection, `ssr?: boolean`          |
| create template    | object-form page example, explicit island metadata, build proof |
| docs website       | examples match implemented public API                           |

## CI

`dev` and `main` must pass:

- Lint & Format, including `workflow:check`
- Test
- SOP Gate where configured
- publish dry-run workflow where configured
