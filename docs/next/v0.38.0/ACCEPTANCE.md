# v0.38.0 Acceptance Criteria

v0.38.0 can be called complete only when repository evidence proves the
following criteria.

## Surface Truth

- Every `@openelement/*` package has a recorded product-surface
  classification.
- Every exported public subpath has a recorded classification.
- Package READMEs, root READMEs, website docs, and create templates agree with
  the classification.
- Internal implementation details are not presented as recommended product APIs.

## Product Decisions

- Any new package name or intentional public API removal has ADR coverage.
- Hub disposition is explicit and does not silently become a v1 product.
- UI remains independent from framework routing.
- Protocol contracts remain runtime-free.

## Consumer Proof

- Generated starter projects use the reset surface.
- Consumer smoke proves the documented package graph before release.
- Publish dry-run succeeds for all publishable packages.

## Gates

- `deno task workflow:check`
- `deno task graph:check`
- `deno task arch:check`
- `deno task docs:check-current`
- `deno task docs:check-strategy`
- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task test`
- `deno task test:e2e`
- `deno task build`
- `deno task dsd:check-report`
- `deno task publish:dry-run`

## Release Truth

- `dev` non-JSR CI is green before merge/sync to `main`.
- `main` non-JSR CI is green before tag/release.
- JSR publish and JSR visibility are recorded honestly but do not block version
  exit under ADR-0097.
