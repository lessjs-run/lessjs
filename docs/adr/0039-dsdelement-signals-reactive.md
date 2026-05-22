# ADR-0039: DsdElement + Signals Reactive Architecture

> **Status**: ACCEPTED
> **Date**: 2026-05-23
> **Supercedes**: Extends ADR-0036 (Ocean-Island Architecture)
> **Applies to**: v0.21.0 (Reactive DSD)

## Context

ADR-0036 established the Ocean-Island two-layer model: Ocean (DsdElement, zero JS
by default) and Island (Lit/React, full framework reactivity). The gap: Ocean
components are purely static DSD. Any dynamic behavior requires either:

1. Full framework Island (Lit/React) — heavy for simple interactivity
2. Manual `this.shadowRoot!.innerHTML = ...` — imperative, error-prone, no dependency tracking

LessJS already has `@lessjs/signals` — a fine-grained reactive primitive
matching the TC39 Signals proposal. The question: should DsdElement integrate
with Signals to enable zero-framework reactivity in Ocean components?

## Decision

**Yes. DsdElement will support an optional reactive `render()` path via Signals.**

The architecture adds three layers to DsdElement:

1. **`html` tagged template literal** — produces `TemplateResult` containing
   template strings + signal access tracking
2. **Auto-tracking** — signals accessed during `render()` register dependencies
   on the DsdElement instance
3. **Microtask-batched DOM update** — signal changes schedule a microtask;
   the callback patches only the changed DOM nodes

Non-reactive `render(): string` continues to work unchanged. Signals integration
is opt-in at the component level.

## Architecture

```
┌─────────────────────────────────────────────────┐
│ DsdElement                                       │
│                                                   │
│  render(): string          ← static (v0.20)       │
│  render(): TemplateResult  ← reactive (v0.21)    │
│                                                   │
│  ┌─────────────┐    ┌──────────────────────┐     │
│  │ html`...`    │ →  │ TemplateResult        │     │
│  │ tagged tmpl  │    │ - strings: string[]   │     │
│  └─────────────┘    │ - values: SignalValue[]│     │
│                      │ - domRefs: Node[]      │     │
│                      └──────────────────────┘     │
│                               │                    │
│                               ▼                    │
│                      ┌──────────────────────┐     │
│                      │ Signal dependency     │     │
│                      │ tracking (auto)       │     │
│                      └──────────────────────┘     │
│                               │                    │
│                               ▼                    │
│                      ┌──────────────────────┐     │
│                      │ Microtask batcher     │     │
│                      │ → patch DOM nodes     │     │
│                      └──────────────────────┘     │
└─────────────────────────────────────────────────┘
```

## Why Not Lit?

Lit's reactive system is tightly coupled to `LitElement`'s lifecycle
(`willUpdate`, `updated`, `render`, `updateComplete`). DsdElement extends
`HTMLElement` directly — there is no Lit lifecycle. Bridging the two would
require either:

1. Making DsdElement extend LitElement (defeats the zero-dependency goal)
2. Reimplementing Lit's reactivity on top of DsdElement (effectively what this ADR does)

The Signals approach is simpler: `html` tag + auto-tracking + DOM patching.
No `LitElement`, no `ReactiveElement`, no `@lit/reactive-element` dependency.

## Template Literal Design

```ts
// Static (v0.20)
render(): string {
  return `<button>Count: ${this.#count}</button>`;
}

// Reactive (v0.21)
render(): string {
  return html`<button @click=${() => this.#count.value++}>
    Count: ${this.#count}
  </button>`;
}
```

- `html` is a function, not a tag that requires a build step (unlike JSX)
- Signal values are read during render → auto-tracked
- Non-signal values are static → no re-render triggered
- `@click` declarative event binding (existing v0.20 `hydrateEvents` mechanism)

## Consequences

### Positive

- Ocean components gain reactivity without framework dependency
- `@lessjs/signals` package usage expanded — validates its design
- Zero additional runtime for components that don't use signals
- Streaming DSD (ADR-0040) composes naturally — reactive chunks stream independently

### Negative

- `html` tagged template is new API surface that needs documentation
- Signal tracking adds ~2KB gzip to DsdElement base (acceptable)
- Developers must learn the signals pattern (but it's the TC39 standard)

## Related

- ADR-0036: Ocean-Island Architecture
- ADR-0040: Streaming DSD
- `@lessjs/signals`: Signal/SignalObject implementation
- TC39 Signals Proposal: https://github.com/tc39/proposal-signals
