/**
 * @lessjs/core - DsdElement Tests
 *
 * Tests for the zero-dependency DsdElement base class.
 * Covers DSD detection, CSR fallback, event hydration,
 * AbortController cleanup, M-17 guard, StyleSheet merging,
 * and delegatesFocus.
 */

import { assertEquals, assertExists, assertFalse, assertStrictEquals } from 'jsr:@std/assert';
import { DsdElement } from '../src/dsd-element.js';
import { StyleSheet, type StyleSheetLike } from '../src/style-sheet.js';
import type { HydrateEventDescriptor } from '../src/types.js';

// ─── Helper: create a minimal subclass for testing ────────────

function defineTestElement(options?: {
  tagName?: string;
  renderContent?: string;
  hydrateEvents?: HydrateEventDescriptor[];
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
    static override hydrateEvents = options?.hydrateEvents;
    static override delegatesFocus = options?.delegatesFocus;
    static override formAssociated = options?.formAssociated;
    static override observedAttributes = options?.observedAttributes;

    override render(): string {
      return options?.renderContent ?? '<div class="test-inner">rendered</div>';
    }
  }

  customElements.define(tagName, TestElement);
  return { tagName, ctor: TestElement, sheet };
}

// ─── Test 1: render() returns string �?SSR-usable ────────────

Deno.test('DsdElement: render() returns string for SSR compatibility', () => {
  const { tagName } = defineTestElement({ renderContent: '<span>hello</span>' });
  const el = document.createElement(tagName) as DsdElement;
  const result = el.render();
  assertEquals(typeof result, 'string');
  assertEquals(result, '<span>hello</span>');
});

// ─── Test 2: DSD detection �?pre-populated shadow root ────────

Deno.test('DsdElement: DSD detection sets _dsdHydrated when shadowRoot has children', () => {
  const { tagName } = defineTestElement();

  // Simulate DSD: create element, attach shadow, populate it before upgrade
  const el = document.createElement(tagName) as DsdElement;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<div class="dsd-content">pre-populated</div>';

  // Now call createRenderRoot �?should detect DSD
  const root = el.createRenderRoot();
  assertStrictEquals(root, shadow);
  assertEquals(el['_dsdHydrated'], true);
});

// ─── Test 3: CSR fallback �?no shadow root �?create + populate ──

Deno.test('DsdElement: CSR fallback creates shadow root and populates from render()', () => {
  const { tagName } = defineTestElement({ renderContent: '<p>csr content</p>' });
  const el = document.createElement(tagName) as DsdElement;

  // No DSD �?shadowRoot should be null initially
  assertEquals(el.shadowRoot, null);

  // connect to DOM to trigger connectedCallback
  document.body.appendChild(el);

  // After connectedCallback: shadowRoot should exist and contain rendered content
  assertExists(el.shadowRoot);
  assertEquals(el.shadowRoot!.mode, 'open');
  assertFalse(el['_dsdHydrated']);
  assertEquals(el.shadowRoot!.innerHTML, '<p>csr content</p>');

  // Cleanup
  document.body.removeChild(el);
});

// ─── Test 4: hydrateEvents binding �?events trigger correctly ──

Deno.test('DsdElement: hydrateEvents bind events to shadow DOM elements', () => {
  let clickCount = 0;

  const events: HydrateEventDescriptor[] = [
    { selector: 'button.action', event: 'click', method: '_handleClick' },
  ];

  const { tagName } = defineTestElement({
    renderContent: '<button class="action">Click me</button>',
    hydrateEvents: events,
  });

  // Register a custom subclass with the handler method
  const tagName2 = `test-click-${Math.random().toString(36).slice(2, 7)}`;
  class ClickElement extends DsdElement {
    static override hydrateEvents = events;

    clickCount = 0;

    _handleClick(_e: Event): void {
      this.clickCount++;
    }

    override render(): string {
      return '<button class="action">Click me</button>';
    }
  }
  customElements.define(tagName2, ClickElement);

  // Simulate DSD: pre-populate shadow root
  const el = document.createElement(tagName2) as ClickElement;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<button class="action">Click me</button>';
  el['_dsdHydrated'] = true;

  // Connect to trigger _hydrateEvents
  document.body.appendChild(el);

  // Click the button inside the shadow root
  const button = el.shadowRoot!.querySelector('button.action')!;
  (button as HTMLButtonElement).click();

  assertEquals(el.clickCount, 1);

  // Cleanup
  document.body.removeChild(el);
});

// ─── Test 5: AbortController cleanup on disconnect ────────────

Deno.test('DsdElement: disconnectedCallback aborts event listeners', () => {
  let callCount = 0;

  const tagName = `test-abort-${Math.random().toString(36).slice(2, 7)}`;
  class AbortElement extends DsdElement {
    static override hydrateEvents: HydrateEventDescriptor[] = [
      { selector: 'button', event: 'click', method: '_onClick' },
    ];

    _onClick(_e: Event): void {
      callCount++;
    }

    override render(): string {
      return '<button>Test</button>';
    }
  }
  customElements.define(tagName, AbortElement);

  // Simulate DSD
  const el = document.createElement(tagName) as AbortElement;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<button>Test</button>';
  el['_dsdHydrated'] = true;

  document.body.appendChild(el);

  // Click once to verify it works
  const button = el.shadowRoot!.querySelector('button')!;
  (button as HTMLButtonElement).click();
  assertEquals(callCount, 1);

  // Disconnect should abort listeners
  document.body.removeChild(el);

  // After disconnect, clicking the button (if possible) should not increment
  // The abort controller should have been cleaned up
  assertFalse(!!el['_hydrateAbortController']);
});

// ─── Test 6: M-17 guard �?__ methods skipped ──────────────────

Deno.test('DsdElement: M-17 guard skips methods starting with __', () => {
  let normalCount = 0;
  let dunderCount = 0;

  const tagName = `test-m17-${Math.random().toString(36).slice(2, 7)}`;
  class M17Element extends DsdElement {
    static override hydrateEvents: HydrateEventDescriptor[] = [
      { selector: 'button.normal', event: 'click', method: '_normalHandler' },
      { selector: 'button.dunder', event: 'click', method: '__proto__' },
    ];

    _normalHandler(_e: Event): void {
      normalCount++;
    }

    __proto__(): void {
      dunderCount++;
    }

    override render(): string {
      return `<button class="normal">Normal</button><button class="dunder">Dunder</button>`;
    }
  }
  customElements.define(tagName, M17Element);

  const el = document.createElement(tagName) as M17Element;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML =
    '<button class="normal">Normal</button><button class="dunder">Dunder</button>';
  el['_dsdHydrated'] = true;

  document.body.appendChild(el);

  // Click both buttons
  const normalBtn = el.shadowRoot!.querySelector('button.normal')!;
  const dunderBtn = el.shadowRoot!.querySelector('button.dunder')!;
  (normalBtn as HTMLButtonElement).click();
  (dunderBtn as HTMLButtonElement).click();

  assertEquals(normalCount, 1);
  // M-17 guard: __ method should NOT have been bound
  assertEquals(dunderCount, 0);

  document.body.removeChild(el);
});

// ─── Test 7: StyleSheetLike merging ──────────────────────────────

Deno.test('DsdElement: StyleSheetLike(s) applied to adoptedStyleSheets in CSR', () => {
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

// ─── Test 8: delegatesFocus ─────────────────────────────────────

Deno.test('DsdElement: delegatesFocus is passed to attachShadow', () => {
  const tagName = `test-focus-${Math.random().toString(36).slice(2, 7)}`;
  class FocusElement extends DsdElement {
    static override delegatesFocus = true;

    override render(): string {
      return '<input type="text">';
    }
  }
  customElements.define(tagName, FocusElement);

  const el = document.createElement(tagName) as FocusElement;
  document.body.appendChild(el);

  assertExists(el.shadowRoot);
  // The delegatesFocus property should be reflected in the shadow root
  // In spec-compliant browsers, shadowRoot.delegatesFocus is true
  assertEquals(el.shadowRoot!.delegatesFocus, true);

  document.body.removeChild(el);
});

Deno.test('DsdElement: delegatesFocus defaults to false', () => {
  const { tagName } = defineTestElement();

  const el = document.createElement(tagName) as DsdElement;
  document.body.appendChild(el);

  assertExists(el.shadowRoot);
  assertEquals(el.shadowRoot!.delegatesFocus, false);

  document.body.removeChild(el);
});

// ─── Test: DSD path skips innerHTML population ─────────────────

Deno.test('DsdElement: DSD path does not overwrite existing shadow DOM', () => {
  const { tagName } = defineTestElement({ renderContent: '<div>csr</div>' });

  // Simulate DSD with pre-populated content
  const el = document.createElement(tagName) as DsdElement;
  const shadow = el.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<div class="dsd-content">dsd original</div>';

  // Connect �?should detect DSD and NOT overwrite
  document.body.appendChild(el);

  assertEquals(el['_dsdHydrated'], true);
  // Content should still be the DSD content, not the CSR render() result
  assertEquals(el.shadowRoot!.innerHTML, '<div class="dsd-content">dsd original</div>');

  document.body.removeChild(el);
});
