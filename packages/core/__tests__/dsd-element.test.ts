/**
 * @lessjs/core - DsdElement Tests
 * Tests for the zero-dependency DsdElement base class.
 * Covers DSD detection, CSR fallback, template event binding,
 * AbortController cleanup, M-17 guard, StyleSheet merging,
 * and delegatesFocus.
 */

import { assertEquals, assertExists, assertStrictEquals } from 'jsr:@std/assert@1';
import { DsdElement } from '../src/dsd-element.js';
import { StyleSheet, type StyleSheetLike } from '@lessjs/style-sheet';
import { jsx } from '../src/jsx-runtime.ts';
import type { VNode } from '../src/vnode.ts';
import { renderDsdTree } from '../src/render-ir.ts';

// Helper: create a minimal subclass for testing.

function htmlFixture(markup: string): VNode {
  return jsx('div', { innerHTML: markup, trustedHtml: true });
}

function defineTestElement(options?: {
  tagName?: string;
  renderContent?: string;
  styles?: StyleSheetLike | StyleSheetLike[];
  delegatesFocus?: boolean;
  formAssociated?: boolean;
  observedAttributes?: string[];
}): {
  tagName: string;
  ctor: typeof DsdElement & (new () => DsdElement);
  sheet: StyleSheetLike;
} {
  const tagName = options?.tagName ?? `test-el-${Math.random().toString(36).slice(2, 7)}`;
  const sheet = new StyleSheet();
  sheet.replaceSync(':host { display: block; }');

  class TestElement extends DsdElement {
    static override styles = options?.styles ?? sheet;
    static override delegatesFocus = options?.delegatesFocus;
    static override formAssociated = options?.formAssociated;
    static override observedAttributes = options?.observedAttributes;

    override render(): VNode | null {
      return htmlFixture(options?.renderContent ?? '<div class="test-inner">rendered</div>');
    }
  }

  if (hasDOM) customElements.define(tagName, TestElement);
  return { tagName, ctor: TestElement, sheet };
}

// Skip all tests when no DOM (SSR/Deno without --dom flag)
const hasDOM = typeof customElements !== 'undefined';

// render() returns a VNode usable by SSR.

Deno.test('DsdElement: render() returns VNode for SSR', async () => {
  if (!hasDOM) return;
  const { tagName } = defineTestElement({ renderContent: '<span>hello</span>' });
  const el = document.createElement(tagName) as DsdElement;
  const result = el.render();
  assertEquals(typeof result, 'object');
  assertEquals(await renderDsdTree(result), '<div><span>hello</span></div>');
});

// DSD detection for a pre-populated shadow root.

Deno.test('DsdElement: DSD detection sets _dsdHydrated when shadowRoot has children', () => {
  if (!hasDOM) return;
  const { tagName } = defineTestElement();

  // Simulate DSD: create element, attach shadow, populate it before upgrade
  const el = document.createElement(tagName) as DsdElement;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<div class="dsd-content">pre-populated</div>';

  // Now call createRenderRoot ???should detect DSD
  const root = el.createRenderRoot();
  assertStrictEquals(root, shadow);
});

// CSR fallback creates and populates a shadow root.

Deno.test('DsdElement: CSR fallback creates shadow root and populates from render()', () => {
  if (!hasDOM) return;
  const { tagName } = defineTestElement({ renderContent: '<p>csr content</p>' });
  const el = document.createElement(tagName) as DsdElement;

  // No DSD ???shadowRoot should be null initially
  assertEquals(el.shadowRoot, null);

  // connect to DOM to trigger connectedCallback
  document.body.appendChild(el);

  // After connectedCallback: shadowRoot should exist and contain rendered content
  assertExists(el.shadowRoot);
  assertEquals(el.shadowRoot!.mode, 'open');
  assertEquals(el.shadowRoot!.innerHTML, '<p>csr content</p>');

  // Cleanup
  document.body.removeChild(el);
});

Deno.test('DsdElement: existing empty shadow root uses CSR render path', () => {
  if (!hasDOM) return;
  const { tagName } = defineTestElement({ renderContent: '<p>empty root rendered</p>' });
  const el = document.createElement(tagName) as DsdElement;
  const shadow = el.attachShadow({ mode: 'open' });

  document.body.appendChild(el);

  assertStrictEquals(el.shadowRoot, shadow);
  assertEquals(el.shadowRoot!.innerHTML, '<p>empty root rendered</p>');

  document.body.removeChild(el);
});

Deno.test('DsdElement: requestUpdate() aliases update() for controllers', () => {
  if (!hasDOM) return;

  const tagName = `test-request-update-${Math.random().toString(36).slice(2, 7)}`;
  class RequestUpdateElement extends DsdElement {
    value = 'before';

    override render(): VNode | null {
      return jsx('span', { children: this.value });
    }
  }
  customElements.define(tagName, RequestUpdateElement);

  const el = document.createElement(tagName) as RequestUpdateElement;
  document.body.appendChild(el);

  el.value = 'after';
  el.requestUpdate();

  assertEquals(el.shadowRoot!.innerHTML, '<span>after</span>');

  document.body.removeChild(el);
});

// AbortController cleanup on disconnect (via template bindings).
// _scopeDispose deleted in v0.27 (ADR-0067: Set-based effect tracking).
// Test verifies event listeners are removed on disconnect.

Deno.test('DsdElement: disconnectedCallback disposes VNode event markers', async () => {
  if (!hasDOM) return;
  let callCount = 0;

  const tagName = `test-abort-${Math.random().toString(36).slice(2, 7)}`;
  class AbortElement extends DsdElement {
    _onClick(_e: Event): void {
      callCount++;
    }

    override render(): VNode | null {
      return jsx('button', {
        onClick: () => this._onClick(new Event('click')),
        children: 'click',
      });
    }
  }
  if (hasDOM) customElements.define(tagName, AbortElement);

  // Simulate DSD
  const el = document.createElement(tagName) as AbortElement;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML = await renderDsdTree(el.render());

  document.body.appendChild(el);

  // After hydration, click handler should be bound
  const btn = shadow.querySelector('button')!;
  assertExists(btn);
  btn.click();
  assertEquals(callCount, 1);

  document.body.removeChild(el);

  // After disconnect, event listener is cleaned up; click should not fire.
  callCount = 0;
  btn.click();
  assertEquals(callCount, 0);
});

Deno.test('DsdElement: DSD VNode event markers hydrate inline handlers', async () => {
  if (!hasDOM) return;
  let callCount = 0;

  const tagName = `test-marker-event-${Math.random().toString(36).slice(2, 7)}`;
  class MarkerEventElement extends DsdElement {
    override render(): VNode | null {
      return jsx('button', {
        onClick: () => {
          callCount++;
        },
        children: ['click'],
      });
    }
  }
  customElements.define(tagName, MarkerEventElement);

  const el = document.createElement(tagName) as MarkerEventElement;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML = await renderDsdTree(el.render());

  document.body.appendChild(el);

  const btn = shadow.querySelector('button')!;
  assertExists(btn);
  assertEquals(btn.getAttribute('data-eid'), 'e0');
  btn.click();
  assertEquals(callCount, 1);

  document.body.removeChild(el);

  callCount = 0;
  btn.click();
  assertEquals(callCount, 0);
});

// M-17 guard removed; _hydrateEvents has been removed in v0.21.0.
// Event binding via html template @click does not use method-name strings.

Deno.test('DsdElement: html @click bindings use direct function references (no M-17 concern)', () => {
  if (!hasDOM) return;
  // M-17 was specific to hydrateEvents method-name strings.
  // html template @click accepts function references directly,
  // so prototype pollution via method-name strings is impossible.
  // This test is kept as a documentation check.
  assertEquals(typeof DsdElement.prototype.render, 'function');
});

// StyleSheetLike values are applied in CSR.

Deno.test('DsdElement: StyleSheetLike(s) applied to adoptedStyleSheets in CSR', () => {
  if (!hasDOM) return;
  const sheet1 = new StyleSheet();
  sheet1.replaceSync(':host { color: red; }');
  const sheet2 = new StyleSheet();
  sheet2.replaceSync(':host { margin: 8px; }');

  const { tagName } = defineTestElement({
    styles: [sheet1, sheet2],
    renderContent: '<span>styled</span>',
  });

  const el = document.createElement(tagName) as DsdElement;
  // CSR path: no pre-populated shadow root
  document.body.appendChild(el);

  assertExists(el.shadowRoot);
  const adopted = el.shadowRoot!.adoptedStyleSheets;
  assertEquals(adopted.length, 2);
  assertStrictEquals(adopted[0], sheet1);
  assertStrictEquals(adopted[1], sheet2);

  document.body.removeChild(el);
});

Deno.test('DsdElement: single CSSStyleSheet applied correctly', () => {
  if (!hasDOM) return;
  const sheet = new StyleSheet();
  sheet.replaceSync(':host { display: block; }');

  const { tagName } = defineTestElement({ styles: sheet });

  const el = document.createElement(tagName) as DsdElement;
  document.body.appendChild(el);

  assertExists(el.shadowRoot);
  const adopted = el.shadowRoot!.adoptedStyleSheets;
  assertEquals(adopted.length, 1);
  assertStrictEquals(adopted[0], sheet);

  document.body.removeChild(el);
});

// delegatesFocus behavior.

Deno.test('DsdElement: delegatesFocus is passed to attachShadow', () => {
  if (!hasDOM) return;
  const tagName = `test-focus-${Math.random().toString(36).slice(2, 7)}`;
  class FocusElement extends DsdElement {
    static override delegatesFocus = true;

    override render(): VNode | null {
      return jsx('input', { type: 'text' });
    }
  }
  if (hasDOM) customElements.define(tagName, FocusElement);

  const el = document.createElement(tagName) as FocusElement;
  document.body.appendChild(el);

  assertExists(el.shadowRoot);
  // The delegatesFocus property should be reflected in the shadow root
  // In spec-compliant browsers, shadowRoot.delegatesFocus is true
  assertEquals(el.shadowRoot!.delegatesFocus, true);

  document.body.removeChild(el);
});

Deno.test('DsdElement: delegatesFocus defaults to false', () => {
  if (!hasDOM) return;
  const { tagName } = defineTestElement();

  const el = document.createElement(tagName) as DsdElement;
  document.body.appendChild(el);

  assertExists(el.shadowRoot);
  assertEquals(el.shadowRoot!.delegatesFocus, false);

  document.body.removeChild(el);
});

// DSD path skips innerHTML population.

Deno.test('DsdElement: DSD path does not overwrite existing shadow DOM', () => {
  if (!hasDOM) return;
  const { tagName } = defineTestElement({ renderContent: '<div>csr</div>' });

  // Simulate DSD with pre-populated content
  const el = document.createElement(tagName) as DsdElement;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<div class="dsd-content">dsd original</div>';

  // Connect: should detect DSD and NOT overwrite.
  document.body.appendChild(el);

  // Content should still be the DSD content, not the CSR render() result
  assertEquals(el.shadowRoot!.innerHTML, '<div class="dsd-content">dsd original</div>');

  document.body.removeChild(el);
});

// TG-01: this.params SPA-reactive

Deno.test('DsdElement: this.params is reactive', () => {
  if (!hasDOM) return;

  const tagName = `test-params-${Math.random().toString(36).slice(2, 7)}`;
  class ParamsElement extends DsdElement {
    override render(): VNode | null {
      const p = this.params;
      return jsx('span', { children: `slug=${p.slug || 'none'}` });
    }
  }
  customElements.define(tagName, ParamsElement);

  const el = document.createElement(tagName) as DsdElement;
  document.body.appendChild(el);

  // Initial state: params defaults to {}
  assertEquals(el.shadowRoot!.innerHTML, '<span>slug=none</span>');

  // Set params and re-render
  el.params = { slug: 'hello-world' };
  el.update();
  assertEquals(el.shadowRoot!.innerHTML, '<span>slug=hello-world</span>');

  // Update params again
  el.params = { slug: 'another-post' };
  el.update();
  assertEquals(el.shadowRoot!.innerHTML, '<span>slug=another-post</span>');

  document.body.removeChild(el);
});

Deno.test('DsdElement: this.params default empty object', () => {
  if (!hasDOM) return;

  const tagName = `test-params-default-${Math.random().toString(36).slice(2, 7)}`;
  class DefaultParamsElement extends DsdElement {
    override render(): VNode | null {
      const keys = Object.keys(this.params);
      return jsx('span', { children: `keys=${keys.length}` });
    }
  }
  customElements.define(tagName, DefaultParamsElement);

  const el = document.createElement(tagName) as DsdElement;
  document.body.appendChild(el);

  // Default params should be an empty object
  assertEquals(el.shadowRoot!.innerHTML, '<span>keys=0</span>');
  assertEquals(el.params, {});

  document.body.removeChild(el);
});

// ─── v0.28 (ADR-0068): data-signal-attr attribute bindings ─────────────────

Deno.test('DsdElement: data-signal-attr DSD hydration sets attributes reactively', async () => {
  if (!hasDOM) return;

  const { signal } = await import('@lessjs/signals');
  const tagName = `test-sigattr-${Math.random().toString(36).slice(2, 7)}`;

  const themeSig = signal('dark');

  class ThemeAttrElement extends DsdElement {
    constructor() {
      super();
      this.registerSignal('theme', themeSig);
    }
    override render(): VNode | null {
      return jsx('div', {
        'data-signal': 'theme',
        'data-signal-attr': 'data-theme,class',
        children: 'themed',
      });
    }
  }
  customElements.define(tagName, ThemeAttrElement);

  // Simulate DSD with child content; verify textContent is NOT destroyed.
  const el = document.createElement(tagName) as DsdElement;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML =
    `<div data-signal="theme" data-signal-attr="data-theme,class"><span>child</span></div>`;
  document.body.appendChild(el);

  const div = shadow.querySelector('div')!;
  assertExists(div);

  // Attributes should reflect signal value
  assertEquals(div.getAttribute('data-theme'), 'dark');
  assertEquals(div.getAttribute('class'), 'dark');
  // Children MUST be preserved (textContent skip when data-signal-attr present)
  assertEquals(div.innerHTML, '<span>child</span>');

  // Reactive update
  themeSig.value = 'light';
  await new Promise((r) => setTimeout(r, 50));
  assertEquals(div.getAttribute('data-theme'), 'light');
  assertEquals(div.getAttribute('class'), 'light');
  // Children still intact after reactive update
  assertEquals(div.innerHTML, '<span>child</span>');

  document.body.removeChild(el);
});

Deno.test('DsdElement: data-signal-html DSD hydration sets innerHTML reactively', async () => {
  if (!hasDOM) return;

  const { signal } = await import('@lessjs/signals');
  const tagName = `test-sightml-${Math.random().toString(36).slice(2, 7)}`;

  const htmlSig = signal('<b>bold</b>');

  class HtmlBindElement extends DsdElement {
    constructor() {
      super();
      this.registerSignal('content', htmlSig);
    }
    override render(): VNode | null {
      return jsx('div', { 'data-signal-html': 'content', children: 'fallback' });
    }
  }
  customElements.define(tagName, HtmlBindElement);

  const el = document.createElement(tagName) as DsdElement;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<div data-signal-html="content">fallback</div>`;
  document.body.appendChild(el);

  const div = shadow.querySelector('div')!;
  assertExists(div);

  assertEquals(div.innerHTML, '<b>bold</b>');

  htmlSig.value = '<i>italic</i>';
  await new Promise((r) => setTimeout(r, 50));
  assertEquals(div.innerHTML, '<i>italic</i>');

  document.body.removeChild(el);
});

// ─── v0.28.1: data-signal-class + CSR event re-binding ─────────────────────

Deno.test('DsdElement: data-signal-class toggles CSS class on signal truthiness', async () => {
  if (!hasDOM) return;

  const { signal } = await import('@lessjs/signals');
  const tagName = `test-sigclass-${Math.random().toString(36).slice(2, 7)}`;

  const toggleSig = signal('on');

  class ClassToggleElement extends DsdElement {
    constructor() {
      super();
      this.registerSignal('state', toggleSig);
    }
    override render(): VNode | null {
      return jsx('div', {
        'data-signal': 'state',
        'data-signal-class': 'active',
        children: 'content',
      });
    }
  }
  customElements.define(tagName, ClassToggleElement);

  const el = document.createElement(tagName) as DsdElement;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<div data-signal="state" data-signal-class="active">content</div>`;
  document.body.appendChild(el);

  const div = shadow.querySelector('div')!;
  assertExists(div);

  // Signal 'on' is truthy; class present.
  assertEquals(div.classList.contains('active'), true);

  toggleSig.value = '';
  await new Promise((r) => setTimeout(r, 50));
  // Signal '' is falsy; class removed.
  assertEquals(div.classList.contains('active'), false);

  toggleSig.value = 'on';
  await new Promise((r) => setTimeout(r, 50));
  assertEquals(div.classList.contains('active'), true);

  document.body.removeChild(el);
});

Deno.test('DsdElement: CSR re-render rebinds VNode event markers', () => {
  if (!hasDOM) return;

  const tagName = `test-csrevent-${Math.random().toString(36).slice(2, 7)}`;
  let callCount = 0;

  class CsrEventElement extends DsdElement {
    _testClick() {
      callCount++;
    }
    override render(): VNode | null {
      return jsx('button', {
        onClick: () => this._testClick(),
        children: 'click',
      });
    }
  }
  customElements.define(tagName, CsrEventElement);

  // CSR path (no DSD)
  const el = document.createElement(tagName) as CsrEventElement;
  document.body.appendChild(el);

  const btn = el.shadowRoot!.querySelector('button')!;
  assertExists(btn);
  btn.click();
  assertEquals(callCount, 1);

  // Re-render via requestReactiveUpdate
  el.requestReactiveUpdate();

  // After re-render, event should still be bound
  const btn2 = el.shadowRoot!.querySelector('button')!;
  btn2.click();
  assertEquals(callCount, 2);

  document.body.removeChild(el);
});
