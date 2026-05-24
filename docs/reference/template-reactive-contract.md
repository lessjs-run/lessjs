# LessJS Template and Reactive Contract

Status: v0.21.x hardening baseline\
Scope: `html`, `unsafeHTML`, `DsdElement`, `ReactiveHost`

## Authoring Model

Reactive DSD components should use `html` templates:

```ts
class CounterElement extends DsdElement {
  count = signal(0);

  render() {
    return html`
      <button @click="${() => this.count.value++}">
        Count: ${this.count}
      </button>
    `;
  }
}
```

String-returning `render()` methods remain supported for static and legacy components. `TemplateResult` is the canonical v0.21 authoring path for reactive components.

## Template Rules

| Value                        | Text context                                             | Attribute context                                        |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| string/number/boolean/bigint | escaped                                                  | escaped                                                  |
| `null`/`undefined`           | empty string                                             | empty string                                             |
| array                        | flattened in order                                       | flattened in order                                       |
| nested `TemplateResult`      | rendered recursively                                     | rendered recursively and escaped as needed               |
| signal-like object           | current `.value` rendered and collected for subscription | current `.value` rendered and collected for subscription |
| function in event binding    | runtime binding marker only                              | not serialized                                           |
| property binding             | runtime property marker only                             | not serialized                                           |
| `unsafeHTML()`               | raw HTML in text context                                 | escaped in attribute context                             |

## Safety Boundary

`html` escapes by default. `unsafeHTML()` is the only raw HTML escape hatch and must be used only with trusted content controlled by the application author.

URL-like `href` and `src` values are sanitized so dangerous protocol values such as `javascript:` are neutralized.

## ReactiveHost Contract

`DsdElement` implements `ReactiveHost`:

- `subscribeTo(source)` registers a signal-like source and returns cleanup.
- `requestReactiveUpdate()` schedules a microtask-batched update.
- `disconnectCallback()` aborts runtime event listeners and signal subscriptions.

The protocol exists so the template runtime can subscribe to reactive sources without depending on a private signal implementation.

## Event and Property Binding

Events use `@event=${handler}`:

```ts
html`
  <button @click="${this.handleClick}">Save</button>
`;
```

Properties use `.prop=${value}`:

```ts
html`
  <input .value="${this.value}">
`;
```

Neither handlers nor object properties are serialized into server HTML. SSR output contains runtime binding markers only when runtime markers are explicitly enabled by the renderer.

## Deprecated Contract

`hydrateEvents` is removed from the current authoring model. Do not add new code using static event descriptor arrays. Keep `HydrateEventDescriptor` only as a compatibility type until a later breaking release removes it.
