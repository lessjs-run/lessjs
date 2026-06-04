---
title: 'Core Concepts'
section: 'Core'
label: 'Core Concepts'
order: 2
---

<open-layout locale="$" locales='$' nav-items='$' header-nav='$' current-path="/zh/guide/core-concepts">

          <h1>Core Concepts</h1>
          <p class="subtitle">
            Understand the three core building blocks of openElement: the Component Model (DsdElement + JSX),
            Property Declaration (static props), and the Reactivity System (Signals).
          </p>

          <h2>Component Model: DsdElement + JSX</h2>
          <p>
            openElement components are native Web Components extending <code>DsdElement</code>. JSX provides
            type-safe templates that compile to VNode trees, outputting Declarative Shadow DOM during SSR.
          </p>
          <open-code-block><pre><code>import  from '@openelement/core';

export class GreetingCard extends DsdElement !&lt;/h2&gt;
&lt;p&gt;Welcome to the framework.&lt;/p&gt;
&lt;/div&gt;
);
}
}

customElements.define('greeting-card', GreetingCard);</code></pre></open-code-block>

<p>Key points:</p>
<ul>
<li>Components extend <code>DsdElement</code> and override <code>render()</code></li>
<li>Signals auto-unwrap inside JSX <code></code> — no <code>.value</code> needed</li>
<li>Events use standard camelCase: <code>onClick</code>, <code>onInput</code>, <code>onSubmit</code></li>
</ul>

          <open-callout type="info" label="Why JSX?">
            JSX provides full TypeScript type-checking, IDE autocompletion, syntax highlighting, and AI
            tool compatibility. It replaces the old <code>html\`...\`</code> tagged template DSL and
            compiles to VNode objects — no runtime template parser needed.
          </open-callout>

          <h3>Conditional Rendering</h3>
          <open-code-block><pre><code>// Ternary

// Logical AND
/&gt;}

// Null coalescing
</code></pre></open-code-block>

    <h3>List Rendering</h3>
    <open-code-block><pre><code>const todos = signal([

,
,
]);

return (
&lt;ul&gt;
&gt;
&lt;input type="checkbox" checked= /&gt;

      &lt;/li&gt;
    ))}

&lt;/ul&gt;
);</code></pre></open-code-block>

    <h2>Property Declaration: static props</h2>
    <p>
      Declare component properties using <code>static props</code>. Keys are auto-registered as
      <code>observedAttributes</code> and converted to kebab-case for HTML attributes.
    </p>
    <open-code-block><pre><code>import  from '@openelement/core';

export class ProductCard extends DsdElement ;

override render() &lt;/h3&gt;
&lt;p&gt;$&lt;/p&gt;

      &lt;/div&gt;
    );

}
}

customElements.define('product-card', ProductCard);</code></pre></open-code-block>

<p>Usage:</p>
<open-code-block><pre><code>&lt;product-card title="Widget" price="19.99" in-stock&gt;&lt;/product-card&gt;
&lt;product-card title="Gadget" price="29.99"&gt;&lt;/product-card&gt;</code></pre></open-code-block>

          <table>
            <thead><tr><th>Type</th><th>Property Value</th><th>HTML Attribute Rule</th></tr></thead>
            <tbody>
              <tr><td><code>String</code></td><td>Raw attribute string</td><td>Passed directly</td></tr>
              <tr><td><code>Number</code></td><td>Parsed via <code>Number()</code></td><td>Attribute presence triggers parse</td></tr>
              <tr><td><code>Boolean</code></td><td><code>true</code> if attribute present</td><td>Follows HTML boolean attribute convention</td></tr>
            </tbody>
          </table>

          <h2>Reactivity System: Signals</h2>
          <p>
            Fine-grained reactivity inspired by SolidJS and Preact Signals. When a signal changes, only
            the exact DOM nodes that read that signal are updated.
          </p>

          <h3>signal() — Mutable Reactive Values</h3>
          <open-code-block><pre><code>import  from '@openelement/core';

const count = signal(0);

// Read
console.log(count.value); // 0

// Write
count.value = 1;
count.value++;</code></pre></open-code-block>

          <open-callout type="warning" label="Use .value Outside JSX">
            When reading or writing a signal outside JSX <code></code>, you must use <code>.value</code>.
            Auto-unwrap inside JSX is provided by <code>Symbol.toPrimitive</code> and <code>valueOf()</code>.
          </open-callout>

          <h3>computed() — Derived State</h3>
          <p>Derived read-only values that auto-track dependencies and evaluate lazily:</p>
          <open-code-block><pre><code>import  from '@openelement/core';

const firstName = signal('Jane');
const lastName = signal('Doe');
const fullName = computed(() => firstName.value + ' ' + lastName.value);

console.log(fullName.value); // 'Jane Doe'
firstName.value = 'John';
console.log(fullName.value); // 'John Doe' (auto-updated)</code></pre></open-code-block>

    <h3>effect() — Side Effects</h3>
    <p>Run a callback automatically when tracked signals change. Use for DOM manipulation, logging, external sync:</p>
    <open-code-block><pre><code>import  from '@openelement/core';

const theme = signal('light');
const dispose = effect(() => );

theme.value = 'dark'; // effect runs automatically
dispose(); // stop tracking</code></pre></open-code-block>

    <h2>Complete Example: Counter</h2>
    <p>A component combining DsdElement, static props, and Signals:</p>
    <open-code-block><pre><code>import  from '@openelement/core';

export class Counter extends DsdElement ;

#count = signal(0);
#step = computed(() => this.step ?? 1);
#isEven = computed(() => this.#count.value % 2 === 0);

override render() &lt;/h3&gt;
&lt;p class="count" data-even=&gt;

        &lt;/p&gt;
        &lt;div class="controls"&gt;
          &lt;button onClick=&gt;
            -
          &lt;/button&gt;
          &lt;button onClick=&gt;
            +
          &lt;/button&gt;
        &lt;/div&gt;
        &lt;button class="reset" onClick=&gt;
          Reset
        &lt;/button&gt;
      &lt;/div&gt;
    );

}
}

customElements.define('my-counter', Counter);</code></pre></open-code-block>

<p>Usage:</p>
<open-code-block><pre><code>&lt;my-counter step="2" label="Stepped Counter"&gt;&lt;/my-counter&gt;</code></pre></open-code-block>

          <h2>Best Practices</h2>
          <ul>
            <li><strong>Keep signals granular</strong> — many small signals over one large state object. Minimizes re-render scope.</li>
            <li><strong>Use computed for derived data</strong> — avoid duplication. Computed values are memoized.</li>
            <li><strong>Immutable updates</strong> — assign new references (<code>.map()</code>, spread syntax) to trigger reactivity.</li>
            <li><strong>Avoid effects in render()</strong> — place effects in <code>connectedCallback()</code> or constructor.</li>
            <li><strong>Dispose custom effects</strong> — call dispose in <code>disconnectedCallback()</code>.</li>
          </ul>

          <div class="nav-row">
            <a href="/guide/getting-started" class="nav-link">&larr; Getting Started</a>
            <a href="/guide/routing-and-data" class="nav-link">Routing &amp; Data &rarr;</a>
          </div>
