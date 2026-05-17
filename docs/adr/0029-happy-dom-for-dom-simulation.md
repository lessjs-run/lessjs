# ADR-0029: Happy DOM for v0.18.3 DOM Simulation

- Status: Proposed
- Date: 2026-05-17
- Target: v0.18.3

## Context

v0.18.3 adds an experimental DOM simulation path for client-only Web Components.
The goal is to evaluate whether selected browser-dependent components can be
server-rendered through an isolated environment without weakening the core
admission model.

The key challenge: Web Components often access browser-only DOM APIs during
`connectedCallback()` — `childNodes`, `querySelector`, slot state, layout info.
Without these APIs, components like Shoelace cannot render during SSR.

Three implementation approaches were evaluated:

1. **Self-implement** — write a minimal DOM shim covering only the APIs that
   LessJS components actually need (HTMLElement, connectedCallback, slot).
2. **Happy DOM** — reuse an existing, maintained pure-JS DOM implementation
   with broad Web Component support.
3. **JSDOM** — the oldest and most widely-known DOM-in-JS library.

## Decision

**Use Happy DOM as the underlying DOM environment for v0.18.3 DOM simulation.**

Rationale:

| Criterion              | Self-implement               | Happy DOM                  | JSDOM                                 |
| ---------------------- | ---------------------------- | -------------------------- | ------------------------------------- |
| WC support maturity    | Unknown (will discover bugs) | Good — Lit/Shoelace tested | Poor — customElements.define unstable |
| Maintenance burden     | High — we own every bug      | Medium — active community  | Low — but community nearly dead       |
| Bloat for our use case | Minimal (only needed APIs)   | Moderate — treeshakable    | High — full window object             |
| Startup cost           | Lowest                       | Medium                     | Highest                               |
| Long-term viability    | N/A                          | Active (2024-2026 commits) | Stagnant (last release 2023)          |

**JSDOM** was ruled out because its `customElements.define` support requires
explicit flags and remains unreliable — a showstopper for Web Component SSR.

**Self-implement** is attractive for its minimal footprint but would require
us to re-discover and fix the same edge cases that Happy DOM has already
solved (e.g., slot assignment, composed paths, attribute reflection). The
cost of reinventing a well-known wheel outweighs the bundle savings for an
experimental feature.

**Happy DOM** provides the best balance:

- It supports `customElements.define`, `connectedCallback`,
  `attributeChangedCallback`, and Lit's rendering lifecycle out of the box.
- It is treeshakable — we can import only `HTMLElement`, `customElements`,
  `Document`, and `window` without pulling in unused APIs like `fetch` or
  `Canvas`.
- The community is active and responsive to Web Component issues.
- The performance profile (5-20ms per render) is acceptable for an
  opt-in experimental feature with timeout guards.

### Integration Architecture

```
lessjs({ ssr: { domSimulation: 'explicit' } })
         │
         ▼
  v0.18.3 creates isolated DOM environment
         │
         ▼
  Happy DOM provides: window, document, HTMLElement,
  customElements.define, connectedCallback, slots
         │
         ▼
  Admitted tags registered and rendered
         │
         ▼
  Timeout guard (500ms default) → success/failure
         │
         ▼
  Results written to dsd-report.json
         │
         ▼
  Failure → degrade to client-only, continue build
```

## Consequences

### Positive

- Faster path to a working DOM simulation than self-implementing.
- Happy DOM's existing WC support reduces the risk of missing edge cases.
- We stay focused on the integration layer (config, isolation, timeout,
  reporting, fallback) rather than debugging DOM API quirks.
- The decision is reversible — if Happy DOM proves unsuitable, we can
  swap it out without changing the public API.

### Negative

- Happy DOM adds a third-party dependency with its own release cadence and
  potential breaking changes.
- Bundle size increases (~50KB gzipped) for the simulation path, though
  it is only loaded when `domSimulation !== 'off'`.
- Happy DOM's behavior may diverge from real browsers in subtle ways
  (e.g., event dispatch timing, slot reassignment order).

### Neutral

- The v0.18.3 integration is designed to abstract the DOM environment
  behind an interface, so switching to a different implementation later
  is possible.
- Happy DOM's treeshakable exports mean we can start with a minimal
  import set and expand only as needed.

## References

- [SOP v0.18.3](../sop/v0.18.3-dom-simulation-experiment.md)
- [ADR-0028](./0028-universal-ssr-via-dom-simulation.md) — Conservative
  Third-Party WC SSR Admission (proposes the overall DOM simulation
  strategy)
- [Happy DOM](https://github.com/capricorn86/happy-dom) — GitHub
  repository
