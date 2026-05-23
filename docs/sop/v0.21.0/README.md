# LessJS v0.21.0 - Reactive DSD

> Status: IMPLEMENTED
> Target: DsdElement + Signals, safe templates, streaming DSD

## Mission

v0.21.0 is the core-runtime deepening release. It makes `DsdElement` strong
enough for common interactive Web Components without pulling the Ocean layer
into Lit, React, JSX, a compiler, or a virtual DOM.

The release has three product outcomes:

1. `DsdElement` can opt into Signals-driven reactive rendering.
2. `html` templates are safe by default across SSR, CSR, and nested templates.
3. `renderDSDStream()` gives the future edge handler a request-time streaming
   primitive.

Static DSD remains the default. Framework islands remain the right answer for
large state machines, data grids, editors, rich charts, and deeply interactive
application surfaces.

## DOM Diff Decision

DOM diffing is intentionally removed from v0.21.0.

For LessJS, the right boundary is:

| Need                                                                        | v0.21 answer                                    |
| --------------------------------------------------------------------------- | ----------------------------------------------- |
| A text value, attribute, boolean flag, or small event-driven widget changes | Signals binding patch                           |
| A small conditional block changes                                           | Re-render the local binding region              |
| A large keyed list or complex stateful subtree changes                      | Use a framework island                          |
| A third-party component owns its shadow DOM                                 | Do not diff it; treat it as an upgrade boundary |

Adding `diff()` in v0.21 would create a second rendering engine inside
`DsdElement`. That would increase scheduler, focus, selection, form-state, and
DOM-ownership complexity without matching the DSD-first architecture. The
v0.21 principle is smaller and stronger: patch simple bindings precisely, and
escalate complex UI to Islands.

## Release Order

| Step | SOP     | Priority | Purpose                                                                             | Status         |
| ---- | ------- | -------- | ----------------------------------------------------------------------------------- | -------------- |
| 1    | SOP-001 | P0       | `DsdElement` + Signals reactive render contract                                     | ✅ IMPLEMENTED |
| 2    | SOP-002 | P0       | Safe `html` template processor                                                      | ✅ IMPLEMENTED |
| 3    | SOP-003 | P1       | `renderDSDStream()` and stream metrics                                              | ✅ IMPLEMENTED |
| 4    | SOP-004 | P0       | Fine-grained patching + DX + www migration                                          | ⚠️ PARTIAL     |
| 5    | SOP-006 | P0       | Unified event model — retire `hydrateEvents`                                        | ✅ IMPLEMENTED |
| 6    | SOP-005 | P0       | Verification, release gates, docs sync                                              | ✅ IMPLEMENTED |
| 7    | SOP-007 | P0       | Core package split — `@lessjs/compat-check`, `@lessjs/cem`, `@lessjs/style-sheet`   | ✅ IMPLEMENTED |
| 8    | SOP-008 | P0       | ReactiveHost protocol — explicit Signal integration protocol (replaces Duck Typing) | ✅ IMPLEMENTED |
| 9    | SOP-009 | P0       | Closure & Remediation — fix all review gaps                                         | 🔴 IN PROGRESS |

## Entry Criteria

- v0.20 Ocean-Island baseline is stable: `DsdElement`, `StyleSheet`,
  `hydrateEvents`, DSD report, and static `render(): string` tests pass.
- `@lessjs/signals` has passing `signal`, `computed`, `effect`, batching, and
  subscription tests.
- `docs/status/STATUS.md`, `docs/roadmap/ROADMAP.md`, and this SOP agree that
  v0.21.0 is Reactive DSD and v0.22.0 is Edge Full-Stack.
- The worktree has no unrelated generated artifacts before implementation
  starts.

## Architecture Contract

```text
DsdElement.render()
  -> TemplateResult (via html`...`)
      -> safe SSR string output
      -> binding records for dynamic values
      -> signal subscriptions for reactive values
      -> microtask-batched updates
      -> direct text/attribute/property/boolean binding patches

Event binding (unified in v0.21.0)
  -> @click=${handler}  — sole event binding mechanism
  -> SSR emits data-less-event-N marker
  -> client resolves marker to addEventListener
  -> hydrateEvents: REMOVED in v0.21.0 (no backward compat)

ReactiveHost Protocol
  -> ReactiveHost interface in @lessjs/core/types
  -> subscribeTo(source: SignalLike): Unsubscribe
  -> requestReactiveUpdate(): void
  -> DsdElement implements ReactiveHost
  -> External signal libs target ReactiveHost, not Duck Typing

Core Package Split
  -> @lessjs/core: DSD engine + DsdElement + adapter registry + types
  -> @lessjs/compat-check: SSR compatibility classifier
  -> @lessjs/cem: Custom Elements Manifest parser
  -> @lessjs/style-sheet: Cross-environment CSSStyleSheet shim

Streaming
  -> renderDSDStream()
  -> ReadableStream<Uint8Array>
  -> shell first, component chunks next, footer last
  -> per-chunk error fallback and metrics
```

## Public API Target

<!-- deno-fmt-ignore -->
```ts
import { DsdElement, html, unsafeHTML } from '@lessjs/core';
import { signal } from '@lessjs/signals';

class LessCounter extends DsdElement {
  #count = signal(0);

  render() {
    return html`
      <button @click=${() => this.#count.value++}>
        Count: ${this.#count}
      </button>
    `;
  }
}
```

## Documentation Requirements

- Public docs must distinguish static DSD, event-hydrated DSD, reactive DSD,
  framework islands, ISR, and request-time streaming.
- `unsafeHTML()` must be documented as a trust boundary, not a convenience API.
- Docs must say DOM diffing is intentionally not in v0.21.0.
- Docs must not imply every Web Component becomes reactive or SSR-safe.

## Exit Criteria

- Static `DsdElement` components behave exactly as before.
- Reactive components update via microtask-batched component-local rerendering
  after Signal writes.
- Template interpolation is escaped by default in SSR and CSR paths.
- Event bindings work after DSD upgrade and after CSR fallback render.
- `renderDSDStream()` works in a Web `Response`.
- `hydrateEvents` fully removed from all internal components; only `@click` in `html` templates.
- `ReactiveHost` protocol implemented; `DsdElement` uses protocol, not Duck Typing.
- `@lessjs/compat-check`, `@lessjs/cem`, `@lessjs/style-sheet` extracted from core as independent packages.
- SOP-004 targeted and full release gates pass.
- **SOP-009**: All P0 remediation items complete (STATUS.md fixed, www signals migrated, migration guide exists).

## Related

- ADR-0036: Ocean-Island Architecture
- ADR-0039: DsdElement + Signals Reactive Architecture
- ADR-0040: Streaming DSD
- SOP-001: DsdElement + Signals Integration
- SOP-002: Safe Templates
- SOP-003: Streaming DSD
- SOP-004: Integration Depth + DX
- SOP-005: Verification + Release Gate
- SOP-006: Unified Event Model — hydrateEvents Retirement
- SOP-007: Core Package Split — compat-check, cem, style-sheet
- SOP-008: ReactiveHost Protocol — explicit Signal integration
- SOP-009: Closure & Remediation — fix all review gaps (IN PROGRESS)
- Comprehensive Review: `C:\Users\Administrator\Documents\GitHub\lessjs-v0.21.0-comprehensive-review.md`
