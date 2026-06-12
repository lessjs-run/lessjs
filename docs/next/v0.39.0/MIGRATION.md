# v0.39.0 Migration Notes

v0.39.0 is still a `0.x` line. Breaking public terminology and target resets
are allowed, but they must be explicit and backed by ADR evidence.

## Elements Terminology

ADR-0099 resets the public product matrix to:

```text
openElement = Elements + UI + Framework + Protocols
```

The Elements product direction is `@openelement/elements` and `OpenElement`.
This is a target reset only in v0.39.0. The package and class are not
implemented in this documentation/governance pass.

## DsdElement

`DsdElement` is superseded as public product terminology. v0.39.0 does not
promise a long-term public compatibility alias when `OpenElement` is
implemented.

Existing code that imports current `DsdElement`-era primitives can keep using
the current package line until the future Elements package lands. The future
implementation must provide concrete code migration notes before removing or
renaming exported code.

## Web Awesome

Web Awesome is not part of the v0.39.0 implementation, preset, or default UI
strategy. UI remains the first-party `open-*` component product until a future
ADR changes that decision.

## Heavy Framework Islands

The only heavy-framework island adapter proof planned for this line is Vue.
React adapter expansion is not part of v0.39.0.
