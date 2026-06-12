# @openelement/compat-check

Compatibility checking utilities for openElement Web Components and custom
elements.

> v0.40 surface: archive-candidate tooling. This package remains published for
> framework admission checks and Hub evidence while ADR-0103 decides whether it
> merges into release tooling. First-run application docs should not recommend
> direct imports.

`@openelement/compat-check` validates that custom element definitions conform
to the openElement rendering contract and the Custom Elements Manifest (CEM)
specification.

## Exports

| Path | Description                  |
| ---- | ---------------------------- |
| `.`  | Compatibility validation API |

## Dependencies

- `@openelement/core` - core types and rendering contract
- `@openelement/cem` - Custom Elements Manifest types

## License

MIT
