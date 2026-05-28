export const tagName = 'static-props-page';
export const meta = { section: 'Guide', label: 'Static Props', order: 8 };

import { headerNav, navSections } from 'virtual:less-nav';
import { pageStyles } from '../../components/page-styles.js';
import { filterFrameworkNav } from '../../utils/nav-filter.ts';
import { DsdElement } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';

export class StaticPropsPage extends DsdElement {
  static override styles = [openPropsTokenSheet, pageStyles];

  override render() {
    const nav = filterFrameworkNav(navSections);
    return (
      <less-layout
        nav-items={JSON.stringify(nav)}
        header-nav={JSON.stringify(headerNav)}
        current-path='/guide/static-props'
      >
        <div class='container'>
          <h1>Static Props</h1>
          <p class='subtitle'>
            Declare typed component properties with the <code>static props</code>{' '}
            API — zero decorators, full type inference, and automatic attribute observation.
          </p>

          <less-callout type='info' label='Replaces @prop()'>
            In v0.24.1, <code>static props</code> replaces the <code>@prop()</code>{' '}
            decorator (removed). It uses the native <code>static</code>{' '}
            class field — no experimental decorator configuration needed.
          </less-callout>

          <h2>Basic Syntax</h2>
          <p>
            Declare props using a static <code>props</code> field on your component class:
          </p>
          <less-code-block>
            {this._code(`
import { DsdElement } from '@lessjs/runtime';

export class UserCard extends DsdElement {
  static props = {
    name: String,
    age: Number,
    active: Boolean,
  };

  override render() {
    return (
      <div class="card">
        <h3>{this.name}</h3>
        <p>Age: {this.age}</p>
        <span>{this.active ? 'Active' : 'Inactive'}</span>
      </div>
    );
  }
}
          `.trim())}
          </less-code-block>

          <h2>Supported Types</h2>
          <p>Three types are supported:</p>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Declaration</th>
                <th>Attribute Value</th>
                <th>Property Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>String</code>
                </td>
                <td>
                  <code>name: String</code>
                </td>
                <td>Raw attribute string</td>
                <td>
                  <code>string</code>
                </td>
              </tr>
              <tr>
                <td>
                  <code>Number</code>
                </td>
                <td>
                  <code>count: Number</code>
                </td>
                <td>String attribute</td>
                <td>
                  <code>number</code> (parsed via <code>Number()</code>)
                </td>
              </tr>
              <tr>
                <td>
                  <code>Boolean</code>
                </td>
                <td>
                  <code>active: Boolean</code>
                </td>
                <td>Presence of attribute</td>
                <td>
                  <code>true</code> if attribute present
                </td>
              </tr>
            </tbody>
          </table>

          <less-callout type='warning' label='Boolean Props'>
            For <code>Boolean</code> props, the value is <code>true</code>{' '}
            when the attribute is present (regardless of attribute value), and <code>false</code>
            {' '}
            when absent. This follows the standard HTML boolean attribute convention.
          </less-callout>

          <h2>Observed Attributes</h2>
          <p>
            <code>static props</code> keys are auto-registered as{' '}
            <code>observedAttributes</code>. Prop names are converted to kebab-case for attribute
            names:
          </p>
          <less-code-block>
            {this._code(`
export class UserCard extends DsdElement {
  static props = {
    firstName: String,    // observed attribute: "first-name"
    itemCount: Number,    // observed attribute: "item-count"
    isActive: Boolean,    // observed attribute: "is-active"
  };
}
          `.trim())}
          </less-code-block>
          <p>
            When any observed attribute changes, the <code>attributeChangedCallback</code>{' '}
            fires and the corresponding property is updated with the parsed value. This is handled
            internally — you do not need to write the callback yourself.
          </p>

          <h2>attributeChangedCallback Integration</h2>
          <p>
            If you need custom logic when a prop changes, override{' '}
            <code>attributeChangedCallback</code>:
          </p>
          <less-code-block>
            {this._code(`
export class AlertBanner extends DsdElement {
  static props = {
    type: String,    // 'info', 'warning', 'error'
    message: String,
  };

  override attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name === 'type') {
      this._updateStyles(newValue);
    }
  }

  private _updateStyles(type: string | null) {
    // Apply type-specific styles
  }
}
          `.trim())}
          </less-code-block>
          <p>
            Always call <code>super.attributeChangedCallback()</code>{' '}
            to ensure the framework handles the prop-to-property mapping correctly.
          </p>

          <less-callout type='info' label='Reactivity'>
            When a prop changes via attribute, the component automatically re-renders. The{' '}
            <code>render()</code>{' '}
            method is called again through the VNode effect mechanism, and only the changed parts of
            the DOM are updated.
          </less-callout>

          <h2>TypeScript Type Inference: PropsFrom&lt;T&gt;</h2>
          <p>
            Use <code>PropsFrom&lt;typeof Component&gt;</code>{' '}
            to extract the prop types of a component:
          </p>
          <less-code-block>
            {this._code(`
import { type PropsFrom } from '@lessjs/core';
import { UserCard } from './user-card.ts';

// PropsFrom infers: { name: string; age: number; active: boolean }
type UserCardProps = PropsFrom<typeof UserCard>;

// Use for typed templates or wrapper components
function renderCard(props: UserCardProps) {
  return (
    <UserCard
      name={props.name}
      age={props.age}
      active={props.active}
    />
  );
}
          `.trim())}
          </less-code-block>
          <p>
            <code>PropsFrom</code>{' '}
            is a compile-time utility type with zero runtime cost. It provides full type safety when
            composing components.
          </p>

          <h2>Migration from @prop()</h2>
          <p>
            The old <code>@prop()</code>{' '}
            decorator required TypeScript experimental decorators. The new <code>static props</code>
            {' '}
            API uses standard class fields:
          </p>
          <less-code-block>
            {this._code(`
// Before (v0.23.x) — required experimentalDecorators in tsconfig
class MyComp extends DsdElement {
  @prop({ type: String })
  name = '';

  @prop({ type: Number })
  count = 0;

  @prop({ type: Boolean })
  active = false;
}

// After (v0.24.1) — no decorator config needed
class MyComp extends DsdElement {
  static props = {
    name: String,
    count: Number,
    active: Boolean,
  };
}
          `.trim())}
          </less-code-block>
          <p>
            Default values are handled with nullish coalescing in <code>render()</code>{' '}
            or via class field initializers.
          </p>

          <h2>Full Example</h2>
          <p>
            A complete component demonstrating <code>static props</code>{' '}
            with all three types, integrated with signals:
          </p>
          <less-code-block>
            {this._code(`
import { DsdElement, signal } from '@lessjs/runtime';

export class ProductCard extends DsdElement {
  static props = {
    title: String,
    price: Number,
    inStock: Boolean,
  };

  #quantity = signal(1);

  override render() {
    return (
      <div class="product-card">
        <h3>{this.title}</h3>
        <p class="price">
          ${'$'}{this.price.toFixed(2)}
        </p>
        {this.inStock ? (
          <div class="controls">
            <button
              onClick={() => this.#quantity.value--}
              disabled={this.#quantity.value <= 1}
            >
              -
            </button>
            <span>{this.#quantity}</span>
            <button onClick={() => this.#quantity.value++}>
              +
            </button>
          </div>
        ) : (
          <span class="out-of-stock">Out of Stock</span>
        )}
      </div>
    );
  }
}

customElements.define('product-card', ProductCard);

// Usage in HTML:
// <product-card title="Widget" price="19.99" in-stock></product-card>
// <product-card title="Gadget" price="29.99"></product-card>
          `.trim())}
          </less-code-block>
          <p>
            This example shows how static props integrate with signals and conditional rendering.
            The <code>title</code>, <code>price</code>, and <code>inStock</code>{' '}
            props are typed and automatically synchronized with HTML attributes.
          </p>

          <div class='nav-row'>
            <a href='/guide/jsx-components' class='nav-link'>&larr; JSX Components</a>
            <a href='/guide/signal-reactivity' class='nav-link'>Signal Reactivity &rarr;</a>
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

customElements.define(tagName, StaticPropsPage);
export default StaticPropsPage;
