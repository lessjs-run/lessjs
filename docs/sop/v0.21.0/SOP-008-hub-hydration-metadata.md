# SOP-008: Hub Hydration Metadata

> Version: v0.21.0\
> Phase: Public Surface\
> Priority: P1\
> Status: IMPLEMENTED

## Objective

Expose hydration strategy evidence in Registry Hub records and generated
reports so package users can see how a component is admitted.

## Metadata Additions

For each component record, include:

- default hydration strategy
- SSR capability
- client-only reason when applicable
- snapshot availability
- DSD render status

## UI Changes

Registry pages should show:

- `SSR-capable`
- `Client-only`
- `Hydrates on load`
- `Hydrates on idle`
- `Hydrates on visible`
- `Client-only render`

Avoid presenting strategy badges as quality scores.

## CLI Changes

`less add` should warn when a selected component is client-only and suggest the
appropriate directive.

Example:

```text
Use <my-widget client:only> because this package is browser-only.
```

## Verification

- Hub schema tests.
- Registry route tests.
- `deno task hub:validate --strict --json`.
- `deno task hub:check-index`.
