# @openelement/signals

Reactive signals system for openElement, built on alien-signals.

> v0.39 surface: advanced primitive. First-run examples should import signals
> through `@openelement/runtime` unless they are documenting the primitive
> layer directly.

`@openelement/signals` provides the reactive primitive layer used by the
openElement rendering pipeline and island hydration system. It wraps
[alien-signals](https://github.com/nicolo-ribaudo/alien-signals) with
openElement-specific framework integration.

## Install

```bash
deno add jsr:@openelement/signals
```

## Exports

| Path             | Description                                      |
| ---------------- | ------------------------------------------------ |
| `.`              | Public signals API (signal, computed, effect)    |
| `./framework`    | Framework-level integration (batch, signal host) |
| `./alien-engine` | Low-level alien-signals engine access            |

## Features

- Fine-grained reactivity with automatic dependency tracking.
- Computed signals with lazy evaluation.
- Effect system for side effects with cleanup.
- Zero-overhead batching for render cycles.
- No framework lock-in — works with any Web Component.

## License

MIT
