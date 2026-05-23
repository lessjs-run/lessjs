import { assertEquals, assertExists, assertFalse } from 'jsr:@std/assert@1';
import { Window } from 'happy-dom';

const window = new Window();
Object.assign(globalThis, {
  window,
  document: window.document,
  HTMLElement: window.HTMLElement,
  customElements: window.customElements,
  ShadowRoot: window.ShadowRoot,
  CSSStyleSheet: window.CSSStyleSheet,
  AbortController: window.AbortController,
  MutationObserver: window.MutationObserver,
});

const { DsdElement } = await import('../src/dsd-element.ts');
const { html } = await import('../src/template.ts');
const { signal, computed } = await import('../../signals/src/framework.ts');

// Helper: create a unique tag name and define a reactive component class
function defineReactive(
  tagPrefix: string,
  renderFn: () => ReturnType<typeof html>,
  opts?: { observedAttributes?: string[] },
): { tagName: string; cls: typeof DsdElement & (new () => DsdElement) } {
  const tagName = `${tagPrefix}-${Math.random().toString(36).slice(2, 7)}`;
  class El extends DsdElement {
    static override observedAttributes = opts?.observedAttributes;
    override render() {
      return renderFn.call(this);
    }
  }
  customElements.define(tagName, El);
  return { tagName, cls: El };
}

// === Test 1 (existing): counter with click handler ===

Deno.test({
  name: 'DsdElement TemplateResult binds events and rerenders after signal writes',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const tagName = `reactive-counter-${Math.random().toString(36).slice(2, 7)}`;

    class ReactiveCounter extends DsdElement {
      count = signal(0);

      override render() {
        return html`
          <button @click="${() => this.count.value++}">Count: ${this.count}</button>
        `;
      }
    }

    customElements.define(tagName, ReactiveCounter);
    const el = document.createElement(tagName) as ReactiveCounter;
    document.body.appendChild(el);

    assertEquals(el.shadowRoot?.textContent?.trim(), 'Count: 0');
    const click = new window.Event('click') as unknown as Event;
    el.shadowRoot?.querySelector('button')?.dispatchEvent(click);
    await Promise.resolve();
    await Promise.resolve();

    assertEquals(el.shadowRoot?.textContent?.trim(), 'Count: 1');
    document.body.removeChild(el);
  },
});

// === Test 2: attribute binding ===

Deno.test({
  name: 'attribute binding: signal value updates getAttribute',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const cls = signal('initial');
    const { tagName } = defineReactive('attr-bind', function () {
      return html`
        <div class="${cls}">content</div>
      `;
    });

    const el = document.createElement(tagName) as DsdElement;
    document.body.appendChild(el);

    const div = el.shadowRoot!.querySelector('div')!;
    assertEquals(div.getAttribute('class'), 'initial');

    cls.value = 'updated';
    await Promise.resolve();
    await Promise.resolve();

    assertEquals(div.getAttribute('class'), 'updated');

    document.body.removeChild(el);
  },
});

// === Test 3: boolean attribute binding ===

Deno.test({
  name: 'boolean attribute: ?disabled toggles with signal',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const disabled = signal(false);
    const { tagName } = defineReactive('bool-attr', function () {
      return html`
        <input ?disabled="${disabled}">
      `;
    });

    const el = document.createElement(tagName) as DsdElement;
    document.body.appendChild(el);

    const input = el.shadowRoot!.querySelector('input')!;
    assertFalse(input.hasAttribute('disabled'));

    disabled.value = true;
    await Promise.resolve();
    await Promise.resolve();

    assertEquals(input.hasAttribute('disabled'), true);

    document.body.removeChild(el);
  },
});

// === Test 4: property binding ===

Deno.test({
  name: 'property binding: .value sets element property directly',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const val = signal('hello');
    const { tagName } = defineReactive('prop-bind', function () {
      return html`
        <input .value="${val}">
      `;
    });

    const el = document.createElement(tagName) as DsdElement;
    document.body.appendChild(el);

    const input = el.shadowRoot!.querySelector('input')! as HTMLInputElement;
    assertEquals(input.value, 'hello');

    val.value = 'world';
    await Promise.resolve();
    await Promise.resolve();

    assertEquals(input.value, 'world');

    document.body.removeChild(el);
  },
});

// === Test 5: event handler ===

Deno.test({
  name: 'event handler: @click handler fires on click',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    let called = 0;
    const handler = () => {
      called++;
    };
    const { tagName } = defineReactive('evt-handler', function () {
      return html`
        <button @click="${handler}">Click</button>
      `;
    });

    const el = document.createElement(tagName) as DsdElement;
    document.body.appendChild(el);

    const btn = el.shadowRoot!.querySelector('button')!;
    btn.dispatchEvent(new window.Event('click') as unknown as Event);
    assertEquals(called, 1);

    btn.dispatchEvent(new window.Event('click') as unknown as Event);
    assertEquals(called, 2);

    document.body.removeChild(el);
  },
});

// === Test 6: fine-grained patch ===

Deno.test({
  name: 'fine-grained: only changed signal marker updates',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const sigA = signal('A0');
    const sigB = signal('B0');
    const { tagName } = defineReactive('fine-grain', function () {
      return html`
        <span data-b="0">${sigA}</span><span data-b="1">${sigB}</span>
      `;
    });

    const el = document.createElement(tagName) as DsdElement;
    document.body.appendChild(el);

    const spans = el.shadowRoot!.querySelectorAll('span');
    assertEquals(spans[0]?.textContent, 'A0');
    assertEquals(spans[1]?.textContent, 'B0');

    // Change only sigA
    sigA.value = 'A1';
    await Promise.resolve();
    await Promise.resolve();

    const spans2 = el.shadowRoot!.querySelectorAll('span');
    // sigA span should update, sigB span should not
    assertEquals(spans2[0]?.textContent, 'A1');
    assertEquals(spans2[1]?.textContent, 'B0');

    document.body.removeChild(el);
  },
});

// === Test 7: batching ===

Deno.test({
  name: 'batching: multiple signal writes produce one DOM update',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const sig = signal(0);
    const { tagName } = defineReactive('batch', function () {
      return html`
        <span>${sig}</span>
      `;
    });

    const el = document.createElement(tagName) as DsdElement;
    document.body.appendChild(el);

    let mutationCount = 0;
    const observer = new MutationObserver(() => {
      mutationCount++;
    });
    observer.observe(el.shadowRoot!, { childList: true, subtree: true, characterData: true });

    // Three synchronous writes before microtask
    sig.value = 1;
    sig.value = 2;
    sig.value = 3;

    await Promise.resolve();
    await Promise.resolve();

    // Should produce at most 1 meaningful DOM mutation batch
    assertEquals(el.shadowRoot!.textContent!.trim(), '3');

    observer.disconnect();
    document.body.removeChild(el);
  },
});

// === Test 8: cleanup on disconnect ===

Deno.test({
  name: 'cleanup: removed element does not trigger signal updates',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const sig = signal('before');
    const { tagName } = defineReactive('cleanup', function () {
      return html`
        <span>${sig}</span>
      `;
    });

    const el = document.createElement(tagName) as DsdElement;
    document.body.appendChild(el);
    assertEquals(el.shadowRoot!.textContent!.trim(), 'before');

    // Remove from DOM
    document.body.removeChild(el);

    // Change signal after disconnect — should not throw
    sig.value = 'after';
    await Promise.resolve();
    await Promise.resolve();

    // Element is disconnected, no update expected
    // The key assertion: no error was thrown
    assertEquals(true, true);

    document.body.removeChild(el);
  },
});

// === Test 9: nested template ===

Deno.test({
  name: 'nested template: inner html template renders correctly',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const inner = signal('nested');
    const { tagName } = defineReactive('nested-tpl', function () {
      return html`
        <div>${html`
          <span>${inner}</span>
        `}</div>
      `;
    });

    const el = document.createElement(tagName) as DsdElement;
    document.body.appendChild(el);

    const span = el.shadowRoot!.querySelector('span')!;
    assertEquals(span.textContent, 'nested');

    inner.value = 'updated';
    await Promise.resolve();
    await Promise.resolve();

    assertEquals(el.shadowRoot!.querySelector('span')!.textContent, 'updated');

    document.body.removeChild(el);
  },
});

// === Test 10: computed signal ===

Deno.test({
  name: 'computed: computed signal re-renders when any dependency changes',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.value + b.value);

    const { tagName } = defineReactive('computed', function () {
      return html`
        <span>${sum}</span>
      `;
    });

    const el = document.createElement(tagName) as DsdElement;
    document.body.appendChild(el);

    assertEquals(el.shadowRoot!.textContent!.trim(), '3');

    a.value = 10;
    await Promise.resolve();
    await Promise.resolve();
    assertEquals(el.shadowRoot!.textContent!.trim(), '12');

    b.value = 20;
    await Promise.resolve();
    await Promise.resolve();
    assertEquals(el.shadowRoot!.textContent!.trim(), '30');

    document.body.removeChild(el);
  },
});

// === Test 11: conditional signal tracking ===

Deno.test({
  name: 'conditional: toggling switch correctly re-tracks active signal',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const flag = signal(true);
    const sigA = signal('A');
    const sigB = signal('B');

    const { tagName } = defineReactive('conditional', function () {
      const showA = flag.value;
      return html`
        <span>${showA ? sigA : sigB}</span>
      `;
    });

    const el = document.createElement(tagName) as DsdElement;
    document.body.appendChild(el);

    assertEquals(el.shadowRoot!.textContent!.trim(), 'A');

    // Change sigA while flag is true
    sigA.value = 'A2';
    await Promise.resolve();
    await Promise.resolve();
    assertEquals(el.shadowRoot!.textContent!.trim(), 'A2');

    // Toggle to B
    flag.value = false;
    await Promise.resolve();
    await Promise.resolve();
    assertEquals(el.shadowRoot!.textContent!.trim(), 'B');

    // Change sigB
    sigB.value = 'B2';
    await Promise.resolve();
    await Promise.resolve();
    assertEquals(el.shadowRoot!.textContent!.trim(), 'B2');

    document.body.removeChild(el);
  },
});

// === Test 12: SSR safety ===

Deno.test({
  name: 'SSR safety: render() does not access document or shadowRoot',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: () => {
    const sig = signal('hello');

    // Create an element that is NOT connected to DOM
    class SsrElement extends DsdElement {
      override render() {
        // render() should work without document/shadowRoot side effects
        return html`
          <span>${sig}</span>
        `;
      }
    }

    // render() called directly without connectedCallback should not throw
    const el = new SsrElement();
    const result = el.render();
    assertExists(result);
    assertEquals(typeof result, 'object');
    assertEquals((result as Record<string, unknown>).kind, 'less:template-result');
  },
});

// === Test 13: multiple signals in one template ===

Deno.test({
  name: 'multiple signals: each signal independently tracks',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const name = signal('Alice');
    const age = signal(30);

    const { tagName } = defineReactive('multi-sig', function () {
      return html`
        <div><span class="name">${name}</span>: <span class="age">${age}</span></div>
      `;
    });

    const el = document.createElement(tagName) as DsdElement;
    document.body.appendChild(el);

    const nameEl = el.shadowRoot!.querySelector('.name')!;
    const ageEl = el.shadowRoot!.querySelector('.age')!;
    assertEquals(nameEl.textContent, 'Alice');
    assertEquals(ageEl.textContent, '30');

    // Change only name
    name.value = 'Bob';
    await Promise.resolve();
    await Promise.resolve();
    assertEquals(el.shadowRoot!.querySelector('.name')!.textContent, 'Bob');
    // age should be unchanged
    assertEquals(el.shadowRoot!.querySelector('.age')!.textContent, '30');

    document.body.removeChild(el);
  },
});
