export const tagName = 'jsx-components-page';
export const meta = { section: 'Guide', label: 'JSX Components', order: 7 };

import { headerNav, navSections } from 'virtual:less-nav';
import { pageStyles } from '../../components/page-styles.js';
import { filterFrameworkNav } from '../../utils/nav-filter.ts';
import { DsdElement } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';

export class JsxComponentsPage extends DsdElement {
  static override styles = [openPropsTokenSheet, pageStyles];

  override render() {
    const nav = filterFrameworkNav(navSections);
    return (
      <less-layout
        navItems={JSON.stringify(nav)}
        headerNav={JSON.stringify(headerNav)}
        currentPath='/guide/jsx-components'
      >
        <div class='container'>
          <h1>JSX Components</h1>
          <p class='subtitle'>
            LessJS v0.24.1 uses JSX+Signal as its component model. JSX provides type-safe templates
            with full IDE support, replacing the old <code>html`...`</code> tagged template DSL.
          </p>

          <less-callout type='info' label='ADR-0057'>
            JSX replaces the old <code>html`...`</code>{' '}
            tagged template DSL. This change brings full TypeScript type-checking, IDE
            autocompletion, syntax highlighting, and AI tool compatibility — none of which were
            possible with tagged template literals.
          </less-callout>

          <h2>Why JSX?</h2>
          <p>
            The old <code>html`...`</code>{' '}
            tagged template provided reactivity through runtime template parsing, but had
            significant limitations:
          </p>
          <ul>
            <li>
              <strong>No type safety</strong> — template literals are opaque strings to TypeScript
            </li>
            <li>
              <strong>No IDE support</strong>{' '}
              — no autocompletion, no inline error detection, no go-to-definition
            </li>
            <li>
              <strong>No tooling integration</strong>{' '}
              — linters, formatters, and static analyzers could not understand templates
            </li>
            <li>
              <strong>Parser complexity</strong>{' '}
              — the runtime template parser was fragile and hard to debug
            </li>
          </ul>
          <p>
            By adopting JSX, LessJS gains the full power of the TypeScript compiler: type-checked
            attributes, compile-time error detection, and seamless IDE integration. JSX compiles to
            VNode trees at build time via the Vite plugin — no runtime parser needed.
          </p>

          <h2>Your First JSX Component</h2>
          <p>Here is a simple counter component using JSX and Signals:</p>
          <less-code-block>
            {this._code(`
import { DsdElement, signal } from '@lessjs/runtime';

export class Counter extends DsdElement {
  #count = signal(0);

  override render() {
    return (
      <div>
        <p>Count: {this.#count}</p>
        <button onClick={() => this.#count.value++}>
          Increment
        </button>
      </div>
    );
  }
}

customElements.define('my-counter', Counter);
          `.trim())}
          </less-code-block>
          <p>Key points:</p>
          <ul>
            <li>
              <code>signal(0)</code> creates a reactive value stored as a private field
            </li>
            <li>
              In JSX <code>{'{...}'}</code>, signals auto-unwrap — no need for <code>.value</code>
            </li>
            <li>
              <code>onClick</code> binds the click event via native <code>addEventListener</code>
            </li>
            <li>When the signal changes, only the text node containing it re-renders</li>
          </ul>

          <h2>VNode Interface</h2>
          <p>
            JSX compiles to VNode objects — lightweight descriptions of what the DOM should look
            like. A frozen 5-field interface:
          </p>
          <less-code-block>
            {this._code(`
interface VNode {
  tag: string | Function | symbol;   // HTML tag or component class
  props: Record<string, unknown>;    // Attributes and event bindings
  children: (VNode | string)[];      // Child nodes
  key?: string | number;             // Key for list reconciliation
  ref?: (el: Element) => void;       // Ref callback
}
          `.trim())}
          </less-code-block>
          <p>
            You rarely interact with VNodes directly. JSX syntax compiles to <code>h()</code>{' '}
            function calls which produce VNodes. The framework handles diffing and DOM updates. No
            virtual DOM reconciliation — just pure data structures.
          </p>

          <h2>JSX Expressions {'{...}'}</h2>
          <p>
            Use curly braces to embed JavaScript expressions. Signals auto-unwrap:
          </p>
          <less-code-block>
            {this._code(`
import { signal, computed } from '@lessjs/runtime';

const name = signal('World');
const upper = computed(() => name.value.toUpperCase());

// In render():
return (
  <div>
    <p>Hello {name}</p>          // auto-unwraps signal
    <p>Upper: {upper}</p>        // computed signals also auto-unwrap
    <p>Static: {'hello'}</p>     // plain values work too
    <p>Explicit: {name.value}</p> // also works, but unnecessary
  </div>
);
          `.trim())}
          </less-code-block>

          <less-callout type='info' label='Auto-Unwrap'>
            Signals implement <code>Symbol.toPrimitive</code> and{' '}
            <code>valueOf()</code>, which the JSX runtime calls automatically. You rarely need{' '}
            <code>.value</code> inside JSX expressions.
          </less-callout>

          <h2>Event Binding</h2>
          <p>
            Any prop starting with <code>on</code>{' '}
            followed by an uppercase letter is treated as an event handler and bound via native{' '}
            <code>addEventListener</code> with automatic AbortSignal cleanup:
          </p>
          <less-code-block>
            {this._code(`
// Standard events
<button onClick={handleClick}>Click Me</button>
<input onInput={handleInput} onFocus={handleFocus} />
<form onSubmit={handleSubmit}>...</form>

// With inline handlers
<button onClick={() => count.value++}>+1</button>

// With method references (use arrow fields or bind)
<button onClick={this._handleReset}>Reset</button>
          `.trim())}
          </less-code-block>
          <p>
            Unlike the old <code>@click</code>{' '}
            syntax, event names follow the standard JSX camelCase convention. All DOM events are
            supported: <code>onClick</code>, <code>onInput</code>, <code>onSubmit</code>,{' '}
            <code>onKeyDown</code>, <code>onFocus</code>, <code>onBlur</code>, etc.
          </p>

          <h2>Conditional Rendering</h2>
          <p>Use standard JavaScript expressions for conditional rendering:</p>
          <less-code-block>
            {this._code(`
// Ternary operator
return (
  <div>
    {isLoggedIn ? <Dashboard /> : <Login />}
  </div>
);

// Logical AND for show/hide
return (
  <div>
    {error && <ErrorBanner message={error} />}
    {items.length > 0 && <ItemList items={items} />}
  </div>
);

// Null coalescing for defaults
return <p>{username ?? 'Anonymous'}</p>;
          `.trim())}
          </less-code-block>

          <less-callout type='warning' label='Falsy Values'>
            Be careful with <code>&&</code> when the left side might be <code>0</code>. The number
            {' '}
            <code>0</code> is falsy and will render as <code>0</code> in the DOM. Use{' '}
            <code>{'{count > 0 && ...}'}</code> or <code>{'{!!count && ...}'}</code> instead.
          </less-callout>

          <h2>List Rendering</h2>
          <p>
            Use <code>Array.map()</code> with a <code>key</code>{' '}
            prop for efficient list reconciliation:
          </p>
          <less-code-block>
            {this._code(`
const todos = signal([
  { id: 1, text: 'Learn LessJS', done: false },
  { id: 2, text: 'Build an app', done: false },
]);

return (
  <ul>
    {todos.value.map(todo => (
      <li key={todo.id}>
        <input type="checkbox" checked={todo.done} />
        {todo.text}
      </li>
    ))}
  </ul>
);
          `.trim())}
          </less-code-block>
          <p>
            The <code>key</code>{' '}
            prop helps the VNode diffing algorithm correctly identify which items have changed.
            Always use a stable, unique identifier — never use array index as key when the list can
            be reordered.
          </p>

          <h2>Fragment</h2>
          <p>
            Return multiple elements without a wrapper using the Fragment syntax{' '}
            <code>&lt;&gt;...&lt;/&gt;</code>:
          </p>
          <less-code-block>
            {this._code(`
export class MyComponent extends DsdElement {
  override render() {
    return (
      <>
        <Header />
        <Main />
        <Footer />
      </>
    );
  }
}
          `.trim())}
          </less-code-block>
          <p>
            Fragments produce no DOM element. They are useful when a component needs to return
            multiple sibling elements without adding a wrapper <code>&lt;div&gt;</code>.
          </p>

          <h2>SVG Rendering</h2>
          <p>
            SVG elements are auto-detected and created in the correct namespace:
          </p>
          <less-code-block>
            {this._code(`
return (
  <svg width="100" height="100" viewBox="0 0 100 100">
    <circle
      cx="50" cy="50" r="40"
      fill="var(--primary)"
      stroke="var(--border)"
      stroke-width="2"
    />
    <text x="50" y="55" text-anchor="middle" fill="white">
      {count}
    </text>
  </svg>
);
          `.trim())}
          </less-code-block>
          <p>
            SVG attributes like <code>viewBox</code>, <code>stroke-width</code>, and{' '}
            <code>text-anchor</code>{' '}
            are passed through correctly. Signal values work inside SVG text content just like in
            HTML.
          </p>

          <h2>SSR vs CSR Behavior</h2>
          <p>LessJS components render differently depending on the environment:</p>
          <table>
            <thead>
              <tr>
                <th>Aspect</th>
                <th>SSR (Server-Side Rendering)</th>
                <th>CSR (Client-Side Rendering)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Render output</td>
                <td>Declarative Shadow DOM (DSD) HTML string</td>
                <td>Live DOM nodes in shadow root</td>
              </tr>
              <tr>
                <td>Signal subscriptions</td>
                <td>Collected during render, serialized</td>
                <td>Active — DOM updates on change</td>
              </tr>
              <tr>
                <td>Event handlers</td>
                <td>Serialized for hydration</td>
                <td>Bound directly via addEventListener</td>
              </tr>
              <tr>
                <td>
                  <code>effect()</code>
                </td>
                <td>Runs once, output captured</td>
                <td>Runs continuously</td>
              </tr>
              <tr>
                <td>
                  <code>ref</code>
                </td>
                <td>Silently skipped</td>
                <td>Callback invoked with element</td>
              </tr>
            </tbody>
          </table>
          <p>
            During SSR, the framework captures the initial render output as DSD HTML. On the client,
            the component hydrates: existing DOM nodes are adopted and event listeners are attached.
            Content is visible immediately, before any JavaScript executes.
          </p>

          <h2>Component Composition</h2>
          <p>Compose components by nesting them in JSX:</p>
          <less-code-block>
            {this._code(`
export class App extends DsdElement {
  override render() {
    return (
      <div class="app">
        <AppHeader title="My App" />
        <AppSidebar>
          <NavItem to="/" label="Home" />
          <NavItem to="/about" label="About" />
        </AppSidebar>
        <main>
          <slot />
        </main>
      </div>
    );
  }
}
          `.trim())}
          </less-code-block>
          <p>
            Component props are passed as JSX attributes. Children are passed as JSX child nodes.
            The <code>&lt;slot /&gt;</code>{' '}
            element works as in standard Web Components, allowing light DOM content projection.
          </p>

          <div class='nav-row'>
            <a href='/guide/configuration' class='nav-link'>&larr; Configuration</a>
            <a href='/guide/static-props' class='nav-link'>Static Props &rarr;</a>
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

customElements.define(tagName, JsxComponentsPage);
export default JsxComponentsPage;
