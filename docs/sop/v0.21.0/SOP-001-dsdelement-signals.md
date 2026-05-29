> 📦 **HISTORICAL** — applies to v0.21.x only. Superseded by ADR-0057 (JSX+Signal) in v0.24.1.

# SOP-001: DsdElement + Signals Integration

> Version: v0.21.0
> Priority: P0
> Status: IMPLEMENTED
> Depends on: v0.20 Ocean-Island, `@lessjs/signals`, ADR-0039

## Objective

Add an opt-in reactive render path to `DsdElement` while preserving the current
static DSD contract.

The component author should be able to write:

<!-- deno-fmt-ignore -->
```ts
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

The runtime should:

- render safe DSD HTML during SSR/build;
- attach event handlers after browser DSD upgrade;
- subscribe the element to signals used in the template;
- batch signal writes in a microtask;
- rerender the component locally after Signal writes without introducing a
  general DOM diff engine;
- preserve the existing `render(): string` path where it does not block the new
  `TemplateResult` runtime; in conflicts, the v0.21 Reactive DSD contract wins.

## Non-Goals

- Do not add DOM diffing.
- Do not add JSX, a compiler, or a build-time template transform.
- Do not make every component reactive by default.
- Do not change `renderDsd()` callers that already handle string output.
- Do not make `DsdElement` depend on Lit or React.

## Target Files

Primary implementation:

- `packages/core/src/dsd-element.ts`
- `packages/core/src/template.ts`
- `packages/core/src/template-bindings.ts`
- `packages/core/src/index.ts`

Signals integration:

- `packages/signals/src/types.ts`
- `packages/signals/src/framework.ts`

Tests:

- `packages/core/__tests__/dsd-element.test.ts`
- `packages/core/__tests__/reactive-dsd.test.ts`
- `packages/core/__tests__/template-events.test.ts`
- `packages/core/__tests__/render-dsd.test.ts`

> **v0.21.0 implementation note:** `template-bindings` logic is inlined in
> `template.ts` (not a separate file). `render-dsd-stream` logic is inlined in
> `render-dsd.ts` in the v0.21.0 actual implementation, with types re-exported
> from a separate `render-dsd-stream.ts` for the public API surface.
>
> **v0.21.0 实际实现**：`template-bindings.ts` 和 `render-dsd-stream.ts` 的内容
> 已分别内联到 `template.ts` 和 `render-dsd.ts` 中，减少了不必要的文件拆分。
> v0.22.0 可能根据模块大小重新评估是否拆分。

## Public Types

```ts
export type TemplateValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SignalLike<unknown>
  | TemplateResult
  | UnsafeHtml
  | EventListener;

export interface SignalLike<T = unknown> {
  readonly value: T;
  subscribe?(fn: (value: T) => void): () => void;
}

export interface TemplateResult {
  readonly kind: 'less:template-result';
  readonly strings: readonly string[];
  readonly values: readonly TemplateValue[];
}
```

Keep the marker internal enough to avoid third-party spoofing where possible.
Use a symbol marker internally and expose structural types only for TypeScript.

## Step-by-Step Execution

### Step 0: Baseline Guard

- [ ] Run `deno test packages/core/__tests__/dsd-element.test.ts`.
- [ ] Run `deno test packages/signals/__tests__/signal.test.ts packages/signals/__tests__/effect.test.ts`.
- [ ] Record current `DsdElement` behaviors that must not change:
  - DSD upgrade does not overwrite existing shadow root content.
  - CSR fallback still calls `render()` and assigns HTML.
  - `hydrateEvents` still binds declared events.
  - `update()` and `requestUpdate()` still work for string renderers.

### Step 1: Add Template Data Model

- [ ] Create `packages/core/src/template.ts`.
- [ ] Implement `html(strings, ...values)` returning `TemplateResult`.
- [ ] Add `isTemplateResult(value)`.
- [ ] Add `isSignalLike(value)` that accepts LessJS `Signal` shape without
      importing `@lessjs/signals` into core runtime.
- [ ] Do not export `html` from `index.ts` yet.

Acceptance:

- [ ] A simple `html` template returns a stable `TemplateResult`.
- [ ] Nested `html` results are represented without stringifying too early.
- [ ] No new npm, node, Vite, or Hono dependency enters `@lessjs/core`.

### Step 2: Render TemplateResult to Initial HTML

- [ ] Add `renderTemplateToString(result, options)` in `template.ts`.
- [ ] Support text bindings.
- [ ] Support nested templates.
- [ ] Support array values by rendering each item in order.
- [ ] Support `null`, `undefined`, and `false` as empty text.
- [ ] Support `true` as text only in text position.
- [ ] Defer event/property/boolean binding behavior to Step 4 and Step 5.

Acceptance:

- [ ] Initial SSR output is deterministic.
- [ ] Static template strings are treated as trusted developer-authored HTML.
- [ ] Dynamic values go through SOP-002 escaping rules.

### Step 3: Teach DsdElement About TemplateResult

- [ ] Update `DsdElement.render()` return type documentation to
      `string | TemplateResult`, without breaking subclasses that return string.
- [ ] Add a private render dispatcher:
  - string -> existing path;
  - TemplateResult -> template render path;
  - other -> string conversion is not allowed; report clear error in SSR path.
- [ ] Update CSR fallback to render TemplateResult to HTML.
- [ ] Preserve DSD-upgrade path: if DSD already populated the shadow root, do
      not replace it during `connectedCallback`.

Acceptance:

- [ ] Existing static component tests pass unchanged.
- [ ] A TemplateResult component renders in CSR fallback.
- [ ] `renderDsd()` can render a component returning TemplateResult.

### Step 4: Add Binding Records

- [ ] During template rendering, create binding records for each dynamic value.
- [ ] Binding kinds:
  - `text`
  - `attribute`
  - `boolean-attribute`
  - `property`
  - `event`
- [ ] Use comment markers or deterministic data attributes only inside the
      shadow DOM when needed for lookup.
- [ ] Remove or hide internal markers from final user-facing HTML where
      possible.

Acceptance:

- [ ] Text binding updates `textContent`.
- [ ] Attribute binding updates or removes the attribute.
- [ ] Boolean binding adds/removes attribute.
- [ ] Property binding writes the DOM property and does not stringify objects.

### Step 5: Event Binding Syntax

- [ ] Support `@event=${handler}` in templates.
- [ ] Event handlers are functions only; non-functions fail in development and
      become no-op with warning in production/build output.
- [ ] Bind events after DSD upgrade and after CSR fallback.
- [ ] Rebind cleanly after manual `update()`.
- [ ] Use `AbortController` cleanup on disconnect as the existing
      `hydrateEvents` path does.

Acceptance:

- [ ] `@click=${fn}` fires after DSD upgrade.
- [ ] `@input=${fn}` can update a signal.
- [ ] Event listeners are not duplicated after multiple updates.
- [ ] Existing static `hydrateEvents` still works.

### Step 6: Signals Subscription

- [ ] Detect signal-like values in template values.
- [ ] Subscribe once per component instance to each signal used by the current
      template.
- [ ] Store unsubscribe callbacks on the component.
- [ ] On each rerender, remove subscriptions no longer used.
- [ ] Dispose all subscriptions in `disconnectedCallback`.

Acceptance:

- [ ] Signal changes schedule an update.
- [ ] Removed conditional signals no longer trigger updates.
- [ ] Disconnected elements do not update or leak subscriptions.

### Step 7: Microtask Scheduler

- [ ] Add a per-instance pending flag.
- [ ] Multiple signal writes in the same turn schedule one microtask.
- [ ] The microtask coalesces dirty Signal writes for that component.
- [ ] If an update throws, log a concise warning and leave the last good DOM in
      place.

Acceptance:

- [ ] Three writes in one tick produce one update pass.
- [ ] Two components using the same signal each update independently.
- [ ] A failing component does not block other components.

### Step 8: Rerender Component Locally

- [ ] Text binding: Signal value is reflected after the queued local rerender.
- [ ] Attribute binding: escaped attribute value is reflected in the rerendered
      template.
- [ ] Boolean binding: true emits the attribute, false omits it.
- [ ] Property binding: property value is applied after render.
- [ ] Event binding: handler is rebound after render and old listeners are
      aborted.
- [ ] Complex subtree values use the same local rerender path; do not introduce
      general DOM diffing.

Acceptance:

- [ ] Counter update reflects the new Signal value after a microtask.
- [ ] Event handlers still work after the queued rerender.
- [ ] A changing `class` or `aria-*` binding updates correctly.

### Step 9: Export Public API

- [ ] Export `html` and related public types from `@lessjs/core`.
- [ ] Do not export internal binding structures.
- [ ] Keep `unsafeHTML()` export covered by SOP-002.
- [ ] Update typecheck entrypoints if new files are added.

Acceptance:

- [ ] `import { DsdElement, html } from '@lessjs/core'` works.
- [ ] `deno task typecheck` includes new files.

## Verification

Targeted:

```sh
deno test packages/core/__tests__/dsd-element.test.ts
deno test packages/core/__tests__/reactive-dsd.test.ts
deno test packages/core/__tests__/template-events.test.ts
deno test packages/core/__tests__/render-dsd.test.ts
deno test packages/signals/__tests__/signal.test.ts packages/signals/__tests__/effect.test.ts
```

Required test cases:

- [ ] Static `render(): string` path unchanged.
- [ ] `render(): TemplateResult` works in CSR.
- [ ] `renderDsd()` handles TemplateResult.
- [ ] Signal text binding updates through a microtask-batched local rerender.
- [ ] Attribute, boolean, property, and event bindings work.
- [ ] Microtask batching coalesces multiple writes.
- [ ] Subscriptions are cleaned up on disconnect.
- [ ] Conditional signal dependencies are retracked.

## Exit Criteria

- `DsdElement` can host simple reactive components without Lit/React.
- No DOM diff API is introduced.
- No core dependency on `@lessjs/signals` package internals is introduced.
- All existing DSD and adapter tests still pass.

## Related

- ADR-0039: DsdElement + Signals Reactive Architecture
- SOP-002: Safe Templates
- SOP-004: Verification + Release Gate
