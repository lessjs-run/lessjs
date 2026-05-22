# LessJS v0.21.0 — Reactive DSD

> Status: PLANNING
> Target: DsdElement + Signals, safe templates, optional DOM diffing, streaming DSD

## Vision

v0.21 makes `DsdElement` the universal reactive base class. Ocean components
(80% of the page, zero JS by default) gain declarative, fine-grained reactivity
via Signals — without pulling in Lit, React, or any framework runtime.

Streaming DSD enables progressive page delivery: each component's shadow DOM
streams to the browser as it renders, achieving sub-50ms Time-To-First-Byte.

These two capabilities complete the Ocean-Island architecture (ADR-0036):
Ocean = zero JS static + optional Signals reactivity. Island = full framework
(React/Lit) for complex interactions.

## SOP Index

| SOP | Title                               | Priority |
| --- | ----------------------------------- | -------- |
| 001 | DsdElement + Signals Integration    | P0       |
| 002 | Safe Templates — Automatic Escaping | P0       |
| 003 | Optional DOM Diffing                | P1       |
| 004 | Streaming DSD                       | P1       |
| 005 | Verification + Release Gate         | P0       |

## Architecture Principle

```
DsdElement.render() calls signal.get() → auto-track dependency
    ↓
signal.set(value) → notify DsdElement (microtask batched)
    ↓
Fine-grained DOM update — only changed expression, no virtual DOM
    ↓
Optional subtree diff for complex blocks (keyed list, conditionals)
    ↓
Streaming: each component chunk sent as rendered, not after full page
```

## Key Decisions

- **`html` tagged template, not JSX.** Aligns with Lit ecosystem, zero build step.
- **Microtask batching.** Standard platform primitive — no custom scheduler.
- **Fine-grained by default.** Most components only have 1-2 reactive bindings. Diffing is opt-in for complex cases.
- **Signals in `@lessjs/signals`.** Existing package, already published. DsdElement depends on it.

## Related ADRs

- ADR-0039: DsdElement + Signals Reactive Architecture
- ADR-0040: Streaming DSD
- ADR-0036: Ocean-Island Architecture (v0.20 baseline)
- ADR-0033: Renderer Kernel (timing-independent renderDSD)
