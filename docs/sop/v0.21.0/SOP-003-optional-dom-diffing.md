# SOP-003: Optional DOM Diffing

> Version: v0.21.0 (Reactive DSD)
> Priority: P1
> Depends on: SOP-001 (DsdElement + Signals)

## Objective

Provide an optional, opt-in DOM diffing strategy for DsdElement components that
need to render complex UI trees with minimal DOM churn.

The default signal-driven re-render is fine-grained (one DOM node per signal).
But when a signal change affects a large subtree (e.g., a list re-sort, a
conditional block with many children), direct DOM replacement causes layout
thrash and loss of user state (focus, selection, scroll position).

## Two Strategies

| Strategy                   | When                            | How                                 |
| -------------------------- | ------------------------------- | ----------------------------------- |
| **Fine-grained (default)** | Single expression in template   | Direct textContent/nodeValue update |
| **Subtree diff (opt-in)**  | Complex conditional/loop blocks | Minimal DOM patch via keyed diff    |

## Opt-In API

```ts
class MyList extends DsdElement {
  #items = signal([...]);
  #filter = signal('');

  render(): string {
    return html`
      <input @input=${(e) => this.#filter.set(e.target.value)}>
      ${diff(this.#items, this.#filter, (items, filter) => html`
        <ul>
          ${items.filter(i => i.includes(filter)).map(i => html`<li>${i}</li>`)}
        </ul>
      `)}
    `;
  }
}
```

`diff(signals..., renderFn)` tells the template engine: "when any of these
signals change, diff the old and new subtree instead of replacing it."

## Algorithm

- Keyed diff: elements with `data-key` attribute are tracked by key
- No virtual DOM: diff operates on real DOM nodes (the DSD template is already in DOM)
- Minimal operations: insert, remove, move, update text
- Heuristic: O(n) same-level list diff (similar to Vue/React's approach)

## Non-Goals

- Do not make diffing the default (fine-grained is simpler and faster for most cases)
- Do not implement a full virtual DOM (just subtree-level patch)
- Do not add a compiler or build step for diffing

## Verification

- List reorder with keys: only moved DOM nodes, no recreate
- Input focus preserved across diff for unchanged items
- Scroll position preserved across diff
- Performance: 1000-item list diff < 50ms

## Related

- SOP-001: DsdElement + Signals
- ADR-0039: DsdElement + Signals Architecture
