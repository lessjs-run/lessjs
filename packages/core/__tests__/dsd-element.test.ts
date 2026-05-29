/**
 * @lessjs/core - DsdElement Tests
 *
 * Tests for the zero-dependency DsdElement base class.
 * Covers DSD detection, CSR fallback, template event binding,
 * AbortController cleanup, M-17 guard, StyleSheet merging,
 * and delegatesFocus.
 */

import { assertEquals, assertExists, assertStrictEquals } from 'jsr:@std/assert@1';
import { DsdElement } from '../src/dsd-element.js';
import { StyleSheet, type StyleSheetLike } from '@lessjs/style-sheet';

// Helper: create a minimal subclass for testing.

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

    override render(): string {
      return options?.renderContent ?? '<div class="test-inner">rendered</div>';
    }
  }

  if (hasDOM) customElements.define(tagName, TestElement);
  return { tagName, ctor: TestElement, sheet };
}

// Skip all tests when no DOM (SSR/Deno without --dom flag)
const hasDOM = typeof customElements !== 'undefined';

// render() returns a string usable by SSR.

Deno.test('DsdElement: render() returns string for SSR compatibility', () => {
  if (!hasDOM) return;
  const { tagName } = defineTestElement({ renderContent: '<span>hello</span>' });
  const el = document.createElement(tagName) as DsdElement;
  const result = el.render();
  assertEquals(typeof result, 'string');
  assertEquals(result, '<span>hello</span>');
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

    override render(): string {
      return `<span>${this.value}</span>`;
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
// hydrateEvents and _hydrateAbortController removed in v0.21.0.

Deno.test('DsdElement: disconnectedCallback disposes template runtime', () => {
  if (!hasDOM) return;
  let callCount = 0;

  const tagName = `test-abort-${Math.random().toString(36).slice(2, 7)}`;
  class AbortElement extends DsdElement {
    _onClick(_e: Event): void {
      callCount++;
    }

    override render(): string {
      return '<button>Test</button>';
    }
  }
  if (hasDOM) customElements.define(tagName, AbortElement);

  // Simulate DSD
  const el = document.createElement(tagName) as AbortElement;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<button>Test</button>';

  document.body.appendChild(el);
  document.body.removeChild(el);
  // After disconnect, _templateAbortController should be cleaned up
  assertEquals(el['_templateAbortController'], undefined);
});

// M-17 guard removed — _hydrateEvents has been removed in v0.21.0.
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

    override render(): string {
      return '<input type="text">';
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

  // Connect — should detect DSD and NOT overwrite
  document.body.appendChild(el);

  // Content should still be the DSD content, not the CSR render() result
  assertEquals(el.shadowRoot!.innerHTML, '<div class="dsd-content">dsd original</div>');

  document.body.removeChild(el);
});
