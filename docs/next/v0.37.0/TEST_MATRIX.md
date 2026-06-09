# v0.37.0 Test Matrix

## Required Local Gates

```bash
deno task workflow:check
deno task docs:check-strategy
deno task docs:check-current
deno task fmt:check
deno task lint
deno task autoflow:check-dev
deno task autoflow:report:json
```

## Website Gates

Because this version updates the public roadmap page, also run:

```bash
deno task build
deno task test:e2e
```

## Manual Review

- Confirm no product code changed.
- Confirm v0.37.0 remains documentation/contract reset only.
- Confirm AutoFlow remains evidence tooling and does not receive new authority.
