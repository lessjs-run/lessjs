export const tagName = 'signal-reactivity-page';
export const meta = { section: 'Guide', label: 'Signal Reactivity', order: 9 };

import { headerNav, navSections } from '@lessjs/content/nav';
import { pageStyles } from '../../components/page-styles.js';
import { filterDocsNav } from '../../utils/nav-filter.ts';
import { DsdElement } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';

export class SignalReactivityPage extends DsdElement {
  static override styles = [openPropsTokenSheet, pageStyles];

  override render() {
    const nav = filterDocsNav(navSections);
    return (
      <less-layout
        navItems={JSON.stringify(nav)}
        headerNav={JSON.stringify(headerNav)}
        currentPath='/guide/signal-reactivity'
      >
        <div class='container'>
          <h1>Signal Reactivity</h1>
          <p class='subtitle'>
            Understand the fine-grained reactivity system at the heart of LessJS — signals, computed
            values, effects, and how they drive efficient DOM updates without a virtual DOM.
          </p>

          <less-callout type='info' label='Fine-Grained Reactivity'>
            LessJS signals are inspired by SolidJS and Preact Signals. When a signal changes, only
            the exact DOM nodes that read that signal are updated — no virtual DOM diffing of entire
            component trees.
          </less-callout>

          <h2>signal() — Reactive Values</h2>
          <p>
            A signal is a reactive container for a value. Create one with{' '}
            <code>signal(initialValue)</code>, read it with <code>.value</code>, and write it with
            {' '}
            <code>.value = newValue</code>:
          </p>
          <less-code-block>
            {this._code(`
import { signal } from '@lessjs/runtime';

const count = signal(0);
const name = signal('LessJS');
const items = signal<string[]>([]);  // generic for typed arrays

// Read
console.log(count.value);   // 0
console.log(name.value);    // 'LessJS'

// Write
count.value = 1;
count.value++;              // supported
name.value = 'v0.24.1';
items.value = [...items.value, 'new item'];  // immutable update
          `.trim())}
          </less-code-block>

          <less-callout type='warning' label='Always Use .value Outside JSX'>
            When reading or writing a signal in plain TypeScript (outside JSX{' '}
            <code>{'{...}'}</code>), you must use{' '}
            <code>.value</code>. The auto-unwrap only happens inside JSX expressions.
          </less-callout>

          <h2>computed() — Derived State</h2>
          <p>
            <code>computed()</code>{' '}
            creates a read-only signal whose value is derived from other signals. It automatically
            tracks dependencies and recomputes when they change:
          </p>
          <less-code-block>
            {this._code(`
import { signal, computed } from '@lessjs/runtime';

const firstName = signal('Jane');
const lastName = signal('Doe');

const fullName = computed(() =>
  firstName.value + ' ' + lastName.value
);

console.log(fullName.value);  // 'Jane Doe'

firstName.value = 'John';
console.log(fullName.value);  // 'John Doe' (auto-updated)
          `.trim())}
          </less-code-block>
          <p>
            Computed signals are <strong>lazy</strong>: the derivation function only runs when{' '}
            <code>.value</code> is accessed and a dependency has changed. They are also{' '}
            <strong>memoized</strong>: if dependencies haven't changed, the cached value is
            returned.
          </p>
          <less-code-block>
            {this._code(`
// Lazy evaluation example
const expensive = computed(() => {
  console.log('Recomputing...');
  return heavyCalculation(items.value);
});

// 'Recomputing...' only logs when expensive.value is read
// and items has changed since last read
          `.trim())}
          </less-code-block>

          <h2>effect() — Side Effects</h2>
          <p>
            <code>effect()</code>{' '}
            runs a function whenever its tracked signals change. Use it for DOM manipulation,
            logging, or synchronizing external state:
          </p>
          <less-code-block>
            {this._code(`
import { signal, effect } from '@lessjs/runtime';

const theme = signal<'light' | 'dark'>('light');

const dispose = effect(() => {
  // Automatically tracks theme.value
  document.documentElement.setAttribute(
    'data-theme',
    theme.value,
  );
});

// Later: change the theme
theme.value = 'dark';  // effect runs automatically

// Stop the effect when no longer needed
dispose();
          `.trim())}
          </less-code-block>
          <p>
            <code>effect()</code>{' '}
            returns a dispose function. Call it to stop tracking. Effects automatically track every
            signal read during execution — you never need to manually declare dependencies.
          </p>

          <less-callout type='info' label='Auto-Tracking'>
            Tracking is based on <strong>what you actually read</strong>{' '}
            during execution, not on a static dependency list. If a signal is read inside a
            conditional branch that does not execute, it is not tracked.
          </less-callout>

          <h2>Signal Auto-Unwrap in JSX</h2>
          <p>
            Inside JSX <code>{'{...}'}</code>{' '}
            expressions, signals automatically unwrap. This works because signals implement{' '}
            <code>Symbol.toPrimitive</code> and <code>valueOf()</code>:
          </p>
          <less-code-block>
            {this._code(`
const count = signal(0);
const message = signal('Hello');

// In render():
return (
  <div>
    <p>{count}</p>        {/* renders "0", auto-unwrapped */}
    <p>{message}</p>      {/* renders "Hello" */}
    <p>{count.value}</p>  {/* also works, but unnecessary */}
  </div>
);

// What happens behind the scenes:
// 1. JSX expression evaluates
// 2. VNode runtime calls valueOf() on the signal
// 3. The signal registers itself as a dependency of the VNode effect
// 4. When signal.value changes, only that VNode text node updates
          `.trim())}
          </less-code-block>

          <h2>unwrap() — Explicit Unwrapping</h2>
          <p>
            When you need to extract the raw value of a signal outside JSX (e.g., for passing to a
            non-reactive API), use <code>unwrap()</code>:
          </p>
          <less-code-block>
            {this._code(`
import { signal, computed, unwrap } from '@lessjs/runtime';

const user = signal({ name: 'Alice', role: 'admin' });

// unwrap() extracts the raw value without creating a subscription
const raw = unwrap(user);
console.log(raw.name);  // 'Alice'

// Useful for serialization
const json = JSON.stringify(unwrap(user));

// Also works with computed signals
const displayName = computed(() => user.value.name.toUpperCase());
console.log(unwrap(displayName));  // 'ALICE'
          `.trim())}
          </less-code-block>
          <p>
            <code>unwrap()</code>{' '}
            is a one-time snapshot. It does not create any reactive subscription — the returned
            value will not update when the signal changes.
          </p>

          <h2>VNode Effect-Driven Re-Render</h2>
          <p>
            When a component renders, LessJS creates a VNode tree and wraps it in an{' '}
            <code>effect()</code>. This effect tracks which signals were read during rendering. When
            any tracked signal changes, the effect re-executes and patches the DOM:
          </p>
          <div class='flow-diagram'>
            <p>
              <code>render()</code> returns VNode tree &rarr; <code>_renderIntoShadowRoot()</code>
              {' '}
              wraps in <code>effect()</code>{' '}
              &rarr; Effect tracks signals read during render &rarr; Signal changes &rarr; Effect
              re-runs &rarr; VNode diff + minimal DOM patch
            </p>
          </div>
          <p>
            This is the core of LessJS's fine-grained reactivity. Unlike React's component-level
            re-rendering, LessJS updates only the specific text nodes and attributes that depend on
            the changed signal.
          </p>
          <p>
            The framework method <code>DsdElement._renderIntoShadowRoot()</code>{' '}
            handles this automatically. You do not call it directly — it is invoked when the
            component is connected to the DOM.
          </p>

          <h2>Signal Lifecycle</h2>
          <p>
            DsdElement manages signal subscriptions and effect disposal automatically:
          </p>
          <table>
            <thead>
              <tr>
                <th>Method / Property</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>_disposeSignalSubscriptions()</code>
                </td>
                <td>
                  Called on disconnect. Disposes all signal subscriptions created during render.
                </td>
              </tr>
              <tr>
                <td>
                  <code>_vnodeEffectDispose</code>
                </td>
                <td>
                  The dispose function for the VNode rendering effect. Called during disconnection.
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            You typically do not need to override these. The framework handles cleanup when a
            component is removed from the DOM. If you create your own effects in{' '}
            <code>connectedCallback()</code>, store the dispose functions and call them in{' '}
            <code>disconnectedCallback()</code>.
          </p>
          <less-code-block>
            {this._code(`
import { DsdElement, signal } from '@lessjs/runtime';

export class Timer extends DsdElement {
  #elapsed = signal(0);
  #_intervalId?: number;

  override connectedCallback() {
    super.connectedCallback();
    this.#_intervalId = setInterval(() => {
      this.#elapsed.value++;
    }, 1000);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#_intervalId) {
      clearInterval(this.#_intervalId);
    }
    // _disposeSignalSubscriptions() called by super
  }

  override render() {
    return <p>Elapsed: {this.#elapsed}s</p>;
  }
}
          `.trim())}
          </less-code-block>

          <h2>Complete Reactive Component</h2>
          <p>
            A full example combining signals, computed values, and JSX:
          </p>
          <less-code-block>
            {this._code(`
import { DsdElement, signal, computed } from '@lessjs/runtime';

export class ShoppingCart extends DsdElement {
  static props = {
    currency: String,
  };

  #items = signal([
    { id: 1, name: 'Widget', price: 9.99, qty: 1 },
    { id: 2, name: 'Gadget', price: 19.99, qty: 2 },
  ]);

  #total = computed(() =>
    this.#items.value.reduce(
      (sum, item) => sum + item.price * item.qty, 0
    )
  );

  #itemCount = computed(() =>
    this.#items.value.reduce(
      (sum, item) => sum + item.qty, 0
    )
  );

  #updateQty(id: number, delta: number) {
    this.#items.value = this.#items.value
      .map(item =>
        item.id === id
          ? { ...item, qty: Math.max(0, item.qty + delta) }
          : item
      )
      .filter(item => item.qty > 0);
  }

  override render() {
    const currency = this.currency ?? 'USD';
    return (
      <div class="cart">
        <h2>Shopping Cart ({this.#itemCount} items)</h2>
        <ul>
          {this.#items.value.map(item => (
            <li key={item.id} class="cart-item">
              <span class="name">{item.name}</span>
              <span class="price">
                {currency} ${'$'}{item.price.toFixed(2)}
              </span>
              <div class="qty-controls">
                <button onClick={() => this.#updateQty(item.id, -1)}>
                  -
                </button>
                <span>{item.qty}</span>
                <button onClick={() => this.#updateQty(item.id, 1)}>
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div class="total">
          Total: {currency} ${'$'}{this.#total.value.toFixed(2)}
        </div>
      </div>
    );
  }
}

customElements.define('shopping-cart', ShoppingCart);
          `.trim())}
          </less-code-block>
          <p>This component demonstrates:</p>
          <ul>
            <li>
              <code>signal()</code> for mutable state
            </li>
            <li>
              <code>computed()</code> for derived totals and counts
            </li>
            <li>
              <code>static props</code> for the currency attribute
            </li>
            <li>
              Immutable updates via <code>.map()</code> and spread
            </li>
            <li>Event handlers that update signals</li>
            <li>Auto-unwrap in JSX for computed and signal values</li>
          </ul>

          <h2>Best Practices</h2>
          <ul>
            <li>
              <strong>Keep signals granular</strong>{' '}
              — prefer many small signals over one large state object. This minimizes re-render
              scope.
            </li>
            <li>
              <strong>Use computed for derived data</strong>{' '}
              — avoid duplicating derived state. Computed values are memoized and only recompute
              when needed.
            </li>
            <li>
              <strong>Immutable updates</strong>{' '}
              — when mutating arrays or objects in a signal, assign a new reference (<code>
                .map()
              </code>, spread syntax) to trigger reactivity.
            </li>
            <li>
              <strong>Avoid effects in render()</strong> — effects belong in{' '}
              <code>connectedCallback()</code> or constructor. Creating effects inside{' '}
              <code>render()</code> causes duplicate subscriptions.
            </li>
            <li>
              <strong>Clean up custom effects</strong> — always dispose effects in{' '}
              <code>disconnectedCallback()</code> to prevent memory leaks.
            </li>
          </ul>

          <div class='nav-row'>
            <a href='/guide/static-props' class='nav-link'>&larr; Static Props</a>
            <a href='/guide/migration-v0.24' class='nav-link'>Migration (v0.24) &rarr;</a>
          </div>
        </div>
      </less-layout>
    );
  }

  /** Helper: wraps code content in pre/code inside less-code-block. */
  private _code(src: string) {
    return <pre><code>{src}</code></pre>;
  }
}

customElements.define(tagName, SignalReactivityPage);
export default SignalReactivityPage;
