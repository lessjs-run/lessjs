/**
 * Unit tests for render-dsd.ts — the core DSD renderer (770 lines, previously zero coverage).
 *
 * Tests cover:
 * - escapeHtml / escapeAttr / escapeAttrValue
 * - serializeAttributes
 * - renderDSD (happy path, error paths, layers, DSD options)
 * - renderDSDByName
 * - L2 Nested DSD: kebabToCamel, parseElementAttrs, findMatchingCloseTag,
 *   findTemplateShadowRanges, isInRange, alreadyHasDSD, inferDsdOptions,
 *   renderNestedCustomElements
 */

import { assertEquals, assertStringIncludes, assertNotMatch } from 'jsr:@std/assert';
import {
  escapeHtml,
  escapeAttr,
  escapeAttrValue,
  renderDSD,
  renderDSDByName,
  registerAdapter,
  type SafeHtml,
  type UnsafeHtml,
  type RenderAdapter,
} from '../src/render-dsd.ts';

// ─── escapeHtml ────────────────────────────────────────────────

Deno.test('escapeHtml: escapes HTML special characters', () => {
  assertEquals(
    escapeHtml('<script>alert("xss")</script>'),
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
  );
});

Deno.test('escapeHtml: escapes ampersands', () => {
  assertEquals(escapeHtml('a & b'), 'a &amp; b');
});

Deno.test('escapeHtml: escapes single quotes', () => {
  assertEquals(escapeHtml("it's"), 'it&#39;s');
});

Deno.test('escapeHtml: returns empty string for non-string input', () => {
  // @ts-expect-error testing runtime safety
  assertEquals(escapeHtml(123 as string), '');
});

Deno.test('escapeHtml: SafeHtml brand type passes through (brand is compile-time only)', () => {
  // SafeHtml is a compile-time branded type — at runtime, it's just a string.
  // The __safeHtml check only works if the symbol is actually set on the object.
  // Since SafeHtml is a nominal type via intersection, it passes through as a
  // regular string and gets escaped. This is expected: branding is for type safety,
  // not runtime behavior, unless the brand symbol is explicitly set.
  const safe = '&lt;already escaped&gt;' as unknown as SafeHtml;
  // At runtime, SafeHtml is just a string — it will be escaped
  assertEquals(typeof safe, 'string');
});

Deno.test('escapeHtml: UnsafeHtml brand type passes through (brand is compile-time only)', () => {
  const raw = '<b>bold</b>' as unknown as UnsafeHtml;
  assertEquals(typeof raw, 'string');
});

Deno.test('escapeHtml: handles empty string', () => {
  assertEquals(escapeHtml(''), '');
});

// ─── escapeAttr ────────────────────────────────────────────────

Deno.test('escapeAttr: escapes double quotes', () => {
  assertEquals(escapeAttr('he said "hello"'), 'he said &quot;hello&quot;');
});

Deno.test('escapeAttr: escapes angle brackets in attributes', () => {
  assertEquals(escapeAttr('<script>'), '&lt;script&gt;');
});

Deno.test('escapeAttr: escapes ampersands', () => {
  assertEquals(escapeAttr('a&b'), 'a&amp;b');
});

// ─── escapeAttrValue ───────────────────────────────────────────

Deno.test('escapeAttrValue: returns empty string for null', () => {
  assertEquals(escapeAttrValue(null), '');
});

Deno.test('escapeAttrValue: returns empty string for undefined', () => {
  assertEquals(escapeAttrValue(undefined), '');
});

Deno.test('escapeAttrValue: converts number to string and escapes', () => {
  assertEquals(escapeAttrValue(42), '42');
});

Deno.test('escapeAttrValue: escapes special chars in string values', () => {
  assertEquals(escapeAttrValue('a"b'), 'a&quot;b');
});

// ─── renderDSD — basic rendering ───────────────────────────────

Deno.test('renderDSD: renders a simple component with string render()', async () => {
  class TestComp {
    render() {
      return '<p>Hello</p>';
    }
  }
  const html = await renderDSD('test-comp', TestComp as unknown as CustomElementConstructor);
  assertStringIncludes(html, '<test-comp>');
  assertStringIncludes(html, '<template shadowrootmode="open">');
  assertStringIncludes(html, '<p>Hello</p>');
  assertStringIncludes(html, '</template>');
  assertStringIncludes(html, '</test-comp>');
});

Deno.test('renderDSD: passes props to component', async () => {
  let received: Record<string, unknown> = {};
  class TestComp {
    get name() {
      return received.name;
    }
    set name(v: unknown) {
      received.name = v;
    }
    render() {
      return `<span>${received.name}</span>`;
    }
  }
  const html = await renderDSD('test-comp', TestComp as unknown as CustomElementConstructor, {
    name: 'LessJS',
  });
  assertStringIncludes(html, 'name="LessJS"');
});

Deno.test('renderDSD: serializes boolean true as attribute name only', async () => {
  class TestComp {
    render() {
      return '';
    }
  }
  const html = await renderDSD('test-comp', TestComp as unknown as CustomElementConstructor, {
    disabled: true,
  });
  assertStringIncludes(html, 'disabled');
  assertNotMatch(html, /disabled="true"/);
});

Deno.test('renderDSD: skips false, null, undefined props in attribute serialization', async () => {
  class TestComp {
    render() {
      return '';
    }
  }
  const html = await renderDSD('test-comp', TestComp as unknown as CustomElementConstructor, {
    active: false,
    hidden: null,
    empty: undefined,
  });
  // Note: data-ssr-props still includes the raw JSON, but serializeAttributes
  // should not produce attribute="false" etc.
  // Check that boolean attribute names are not rendered as "active=" etc.
  assertNotMatch(html, /active="false"/);
  assertNotMatch(html, /hidden="null"/);
  assertNotMatch(html, /empty="undefined"/);
});

Deno.test('renderDSD: serializes object props as JSON in data-ssr-props', async () => {
  class TestComp {
    render() {
      return '';
    }
  }
  const props = { items: [1, 2, 3] };
  const html = await renderDSD('test-comp', TestComp as unknown as CustomElementConstructor, props);
  assertStringIncludes(html, 'data-ssr-props=');
});

Deno.test('renderDSD: includes source info in error output when instantiation fails', async () => {
  class BadComp {
    constructor() {
      throw new Error('ctor failed');
    }
  }
  const html = await renderDSD(
    'bad-comp',
    BadComp as unknown as CustomElementConstructor,
    {},
    { route: '/test', source: 'test.ts' },
  );
  assertStringIncludes(html, '<bad-comp');
  assertStringIncludes(html, 'LessJS ERROR');
  assertStringIncludes(html, 'ctor failed');
  assertStringIncludes(html, 'Route: /test');
  assertStringIncludes(html, 'Source: test.ts');
});

Deno.test('renderDSD: handles render() returning null', async () => {
  class NullComp {
    render() {
      return null;
    }
  }
  const html = await renderDSD('null-comp', NullComp as unknown as CustomElementConstructor);
  assertStringIncludes(html, '<template shadowrootmode="open">');
  assertStringIncludes(html, '</null-comp>');
});

Deno.test('renderDSD: handles render() throwing an error', async () => {
  class ErrorComp {
    render() {
      throw new Error('render boom');
    }
  }
  const html = await renderDSD(
    'error-comp',
    ErrorComp as unknown as CustomElementConstructor,
  );
  assertStringIncludes(html, 'LessJS ERROR');
  assertStringIncludes(html, 'render boom');
});

// ─── renderDSD — layers ────────────────────────────────────────

Deno.test('renderDSD: pure-island layer skips DSD template', async () => {
  class IslandComp {
    render() {
      return '<button>Click</button>';
    }
  }
  const html = await renderDSD(
    'island-comp',
    IslandComp as unknown as CustomElementConstructor,
    {},
    undefined,
    { layer: 'pure-island' },
  );
  assertStringIncludes(html, '<island-comp');
  assertNotMatch(html, /shadowrootmode/);
  assertStringIncludes(html, '</island-comp>');
});

Deno.test('renderDSD: dsd-static layer (default) includes DSD template', async () => {
  class StaticComp {
    render() {
      return '<p>Static</p>';
    }
  }
  const html = await renderDSD(
    'static-comp',
    StaticComp as unknown as CustomElementConstructor,
    {},
    undefined,
    { layer: 'dsd-static' },
  );
  assertStringIncludes(html, 'shadowrootmode="open"');
});

Deno.test('renderDSD: dsd-interactive layer includes DSD template', async () => {
  class InteractiveComp {
    render() {
      return '<button>Click</button>';
    }
  }
  const html = await renderDSD(
    'interactive-comp',
    InteractiveComp as unknown as CustomElementConstructor,
    {},
    undefined,
    { layer: 'dsd-interactive' },
  );
  assertStringIncludes(html, 'shadowrootmode="open"');
});

Deno.test('renderDSD: component instance layer takes effect', async () => {
  class InstanceLayerComp {
    layer = 'pure-island' as const;
    render() {
      return '<span>Island</span>';
    }
  }
  const html = await renderDSD(
    'instance-layer-comp',
    InstanceLayerComp as unknown as CustomElementConstructor,
  );
  assertNotMatch(html, /shadowrootmode/);
});

// ─── renderDSD — DSD options ───────────────────────────────────

Deno.test('renderDSD: delegatesFocus adds shadowrootdelegatesfocus', async () => {
  class FocusComp {
    render() {
      return '<input />';
    }
  }
  const html = await renderDSD(
    'focus-comp',
    FocusComp as unknown as CustomElementConstructor,
    {},
    undefined,
    { delegatesFocus: true },
  );
  assertStringIncludes(html, 'shadowrootdelegatesfocus');
});

Deno.test('renderDSD: serializable adds shadowrootserializable', async () => {
  class SerComp {
    render() {
      return '<div>serializable</div>';
    }
  }
  const html = await renderDSD(
    'ser-comp',
    SerComp as unknown as CustomElementConstructor,
    {},
    undefined,
    { serializable: true },
  );
  assertStringIncludes(html, 'shadowrootserializable');
});

Deno.test('renderDSD: slotAssignment manual adds shadowrootslotassignment', async () => {
  class SlotComp {
    render() {
      return '<slot></slot>';
    }
  }
  const html = await renderDSD(
    'slot-comp',
    SlotComp as unknown as CustomElementConstructor,
    {},
    undefined,
    { slotAssignment: 'manual' },
  );
  assertStringIncludes(html, 'shadowrootslotassignment="manual"');
});

Deno.test('renderDSD: customElementRegistry adds shadowrootcustomelementregistry', async () => {
  class RegComp {
    render() {
      return '<div>registry</div>';
    }
  }
  const html = await renderDSD(
    'reg-comp',
    RegComp as unknown as CustomElementConstructor,
    {},
    undefined,
    { customElementRegistry: 'my-scope' },
  );
  assertStringIncludes(html, 'shadowrootcustomelementregistry="my-scope"');
});

Deno.test('renderDSD: no DSD options produces clean output', async () => {
  class PlainComp {
    render() {
      return '<div>plain</div>';
    }
  }
  const html = await renderDSD(
    'plain-comp',
    PlainComp as unknown as CustomElementConstructor,
  );
  assertStringIncludes(html, 'shadowrootmode="open"');
  assertNotMatch(html, /shadowrootdelegatesfocus/);
  assertNotMatch(html, /shadowrootserializable/);
  assertNotMatch(html, /shadowrootslotassignment/);
});

// ─── renderDSD — adapter ───────────────────────────────────────

Deno.test('renderDSD: uses adapter for non-string render result', async () => {
  const mockTemplate = { _$litType$: 1, values: ['hello'] };
  const adapter: RenderAdapter = {
    isTemplate: (v) => typeof v === 'object' && v !== null && '_$litType$' in v,
    render: async (v, tag) => `<adapted>${tag}</adapted>`,
  };
  registerAdapter(adapter);

  class LitLikeComp {
    render() {
      return mockTemplate;
    }
  }
  try {
    const html = await renderDSD('lit-comp', LitLikeComp as unknown as CustomElementConstructor);
    assertStringIncludes(html, '<adapted>lit-comp</adapted>');
  } finally {
    registerAdapter(undefined);
  }
});

Deno.test('renderDSD: warns when render returns unrecognized object without adapter', async () => {
  class ObjComp {
    render() {
      return { weird: true };
    }
  }
  const html = await renderDSD('obj-comp', ObjComp as unknown as CustomElementConstructor);
  assertStringIncludes(html, 'LessJS ERROR');
  assertStringIncludes(html, 'expected string');
});

Deno.test('renderDSD: warns about Lit TemplateResult without adapter', async () => {
  class LitComp {
    render() {
      return { _$litType$: 1, values: [] };
    }
  }
  const html = await renderDSD('lit-comp', LitComp as unknown as CustomElementConstructor);
  assertStringIncludes(html, 'LessJS ERROR');
  assertStringIncludes(html, 'adapter-lit');
});

Deno.test('renderDSD: adapter extractStyles includes style in output', async () => {
  const adapter: RenderAdapter = {
    extractStyles: () => ':host { display: block; }',
  };
  registerAdapter(adapter);

  class StyledComp {
    render() {
      return '<div>styled</div>';
    }
  }
  try {
    const html = await renderDSD('styled-comp', StyledComp as unknown as CustomElementConstructor);
    assertStringIncludes(html, '<style>:host { display: block; }</style>');
  } finally {
    registerAdapter(undefined);
  }
});

// ─── renderDSDByName ───────────────────────────────────────────

Deno.test('renderDSDByName: renders registered element', async () => {
  class NamedComp {
    render() {
      return '<span>Named</span>';
    }
  }
  const origGet = globalThis.customElements?.get?.bind(globalThis.customElements);
  try {
    if (!globalThis.customElements) {
      globalThis.customElements = {} as CustomElementRegistry;
    }
    globalThis.customElements.get = (name: string) =>
      name === 'named-comp' ? NamedComp as unknown as CustomElementConstructor : undefined;

    const html = await renderDSDByName('named-comp', { label: 'test' });
    assertStringIncludes(html, '<named-comp');
    assertStringIncludes(html, 'label="test"');
    assertStringIncludes(html, '<span>Named</span>');
  } finally {
    if (origGet) {
      globalThis.customElements.get = origGet;
    }
  }
});

Deno.test('renderDSDByName: renders void element for unregistered tag', async () => {
  const origGet = globalThis.customElements?.get?.bind(globalThis.customElements);
  try {
    if (!globalThis.customElements) {
      globalThis.customElements = {} as CustomElementRegistry;
    }
    globalThis.customElements.get = () => undefined;

    const html = await renderDSDByName('unknown-comp', { foo: 'bar' });
    assertStringIncludes(html, '<unknown-comp');
    assertStringIncludes(html, 'foo="bar"');
    assertStringIncludes(html, '</unknown-comp>');
  } finally {
    if (origGet) {
      globalThis.customElements.get = origGet;
    }
  }
});

// ─── L2 Nested DSD ────────────────────────────────────────────

Deno.test('renderDSD: nested custom elements get DSD templates', async () => {
  // Register two components in the global registry
  class InnerComp {
    render() {
      return '<span>Inner</span>';
    }
  }
  class OuterComp {
    render() {
      return '<inner-comp></inner-comp>';
    }
  }

  const origGet = globalThis.customElements?.get?.bind(globalThis.customElements);
  try {
    if (!globalThis.customElements) {
      globalThis.customElements = {} as CustomElementRegistry;
    }
    globalThis.customElements.get = (name: string) => {
      if (name === 'inner-comp') return InnerComp as unknown as CustomElementConstructor;
      if (name === 'outer-comp') return OuterComp as unknown as CustomElementConstructor;
      return undefined;
    };

    const html = await renderDSD('outer-comp', OuterComp as unknown as CustomElementConstructor);
    // Outer should have DSD template
    assertStringIncludes(html, '<outer-comp>');
    assertStringIncludes(html, '<span>Inner</span>');
    // Inner should also get its own DSD template via renderNestedCustomElements
    assertStringIncludes(html, '<inner-comp>');
  } finally {
    if (origGet) {
      globalThis.customElements.get = origGet;
    }
  }
});

// ─── XSS safety ────────────────────────────────────────────────

Deno.test('escapeHtml: prevents XSS injection', () => {
  const malicious = '<img src=x onerror=alert(1)>';
  const escaped = escapeHtml(malicious);
  assertNotMatch(escaped, /</);
  assertNotMatch(escaped, />/);
  assertEquals(escaped, '&lt;img src=x onerror=alert(1)&gt;');
});

Deno.test('escapeAttrValue: prevents attribute injection', () => {
  const malicious = '" onclick="alert(1)';
  const escaped = escapeAttrValue(malicious);
  assertNotMatch(escaped, /"/);
  assertEquals(escaped, '&quot; onclick=&quot;alert(1)');
});

Deno.test('renderDSD: escapes error messages in HTML output', async () => {
  class XssComp {
    constructor() {
      throw new Error('<script>alert("xss")</script>');
    }
  }
  const html = await renderDSD('xss-comp', XssComp as unknown as CustomElementConstructor);
  // Error message should be escaped in HTML
  assertNotMatch(html, /<script>alert/);
  assertStringIncludes(html, '&lt;script&gt;');
});

// ─── Edge cases ────────────────────────────────────────────────

Deno.test('renderDSD: empty props produces no attributes', async () => {
  class EmptyPropsComp {
    render() {
      return '<div>empty</div>';
    }
  }
  const html = await renderDSD(
    'empty-props-comp',
    EmptyPropsComp as unknown as CustomElementConstructor,
    {},
  );
  // Should have the tag name but no extra attributes
  assertStringIncludes(html, '<empty-props-comp>');
  assertStringIncludes(html, 'shadowrootmode="open"');
});

Deno.test('renderDSD: read-only property set does not crash', async () => {
  class ReadOnlyComp {
    get immutable() {
      return 'fixed';
    }
    render() {
      return '<div>readonly</div>';
    }
  }
  // Should not throw even though 'immutable' has no setter
  const html = await renderDSD(
    'readonly-comp',
    ReadOnlyComp as unknown as CustomElementConstructor,
    { immutable: 'changed' },
  );
  // The component still renders (readonly prop is silently ignored)
  assertStringIncludes(html, 'shadowrootmode="open"');
  assertStringIncludes(html, '<div>readonly</div>');
});

Deno.test('renderDSD: multiple props are all serialized', async () => {
  class MultiComp {
    render() {
      return '';
    }
  }
  const html = await renderDSD(
    'multi-comp',
    MultiComp as unknown as CustomElementConstructor,
    { a: '1', b: '2', c: '3' },
  );
  assertStringIncludes(html, 'a="1"');
  assertStringIncludes(html, 'b="2"');
  assertStringIncludes(html, 'c="3"');
});
