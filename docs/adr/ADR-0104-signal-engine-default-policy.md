# ADR-0104: Signal Engine Default Policy

- Status: Accepted (Updated 2026-06-14)
- Date: 2026-06-13
- Target: v0.40.x
- Depends on: ADR-0096, ADR-0101

## Context

v0.40 evaluates `@preact/signals-core` because Preact is the priority
heavy-framework island proof. However, a default signal-engine change affects
runtime behavior and is explicitly protected by ADR-0101.

The current signal package uses an existing default engine behind
`@openelement/signal`. Protocols already define `SignalEngine` and conformance
tests.

## Decision (Updated 2026-06-14)

Switch the default signal engine from `alien-signals` to `@preact/signals-core`.

The switch is safe because:

- The `SignalEngine` protocol boundary fully abstracts engine details.
- Both engines pass the same conformance test suite.
- `@preact/signals-core` is already a declared dependency of `@openelement/signal`
  (added in v0.40.0 as a candidate).
- `alien-signals` remains available as an optional engine via
  `@openelement/signal/alien-engine` and can be activated at runtime via
  `setSignalEngine()`.
- `@openelement/core` and `@openelement/element` do not import
  `@preact/signals-core` directly — they depend on `@openelement/signal` which
  bundles the dependency.

### Runtime switching

```ts
import { setSignalEngine } from '@openelement/signal';
import { createAlienEngine } from '@openelement/signal/alien-engine';
import { computed, effect, signal } from 'alien-signals';

setSignalEngine(createAlienEngine({ signal, computed, effect }));
```

## Non-Goals

- Do not make Preact the identity of openElement.
- Do not add Preact or `@preact/signals-core` as a required dependency of
  `@openelement/core` or `@openelement/element`.
- Do not change signal scheduling or host update semantics without tests.

## Consequences

### Positive

- `@preact/signals-core` is a smaller, well-maintained engine with broad ecosystem
  compatibility.
- Runtime engine switching allows users to choose alien-signals when they need
  its specific primitives (e.g. `effectScope`).
- `effectScope` is removed from the main public API since it is alien-specific
  and unused in the codebase.

### Negative

- Existing consumers using alien-signals-specific behavior (e.g. `effectScope`,
  `batch`, `untrack`) must explicitly switch to the alien engine.
- The project carries two signal-engine concepts.

## Acceptance

- Existing signal tests remain green after the switch.
- Both engines pass `runSignalEngineConformance`.
- `@openelement/core` and `@openelement/element` do not require Preact signal
  packages.
- `effectScope` is not in the main `@openelement/signal` export.
