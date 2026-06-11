# @openelement/protocols

Dependency-light shared openElement contracts.

This package owns build-time, runtime, renderer, component, route, cache,
signal, and data contracts that must be shared across packages without making
feature packages depend on adapter implementation modules.

It intentionally does not own runtime rendering, Vite or Nitro plugin
implementation, reactive engine implementation, database drivers, server
frameworks, storage backends, or user-facing application configuration.

## Protocol Groups

- `build-types`: build context metadata shared by feature packages and build
  adapters.
- `renderer`: renderer protocol, DSD options, render output, hydration hints,
  and renderer conformance fixture types.
- `components`: component adapter descriptors for replacement-compatible
  component models.
- `routes`: ADR-0098 route manifest and EntryDescriptor data contracts.
- `islands`: island config and client-entry metadata used by renderers and
  bundlers.
- `runtime`: fetch-compatible runtime adapter boundary for Nitro, Workers,
  Node, Deno, or future runtimes.
- `cache`: cache adapter intent without choosing a storage backend.
- `signals`: observable signal shape and signal engine protocol.
- `data`: platform-neutral data adapter contract plus a zero-I/O memory proof.
- `conformance`: protocol behavior checks that implementation packages can run
  against adapters.
