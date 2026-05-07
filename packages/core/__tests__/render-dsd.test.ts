/**
 * @lessjs/core - render-dsd.ts unit tests (Deno)
 *
 * Tests for the core DSD renderer: escape functions, attribute serialization,
 * DSD rendering pipeline, nested custom elements, and edge cases.
 *
 * NOTE: Deno test runner doesn't provide a DOM environment by default.
 * Component classes are plain objects with render() methods — no HTMLElement needed.
 */
import {
  assertEquals,
  assertExists,
  assertFalse,
  assertStringIncludes,
  assertNotMatch,
} from 'jsr:@std/assert@^1.0.0';
import {
  escapeAttrValue,
  escapeHtml,
  escapeAttr,
  renderDSD,
  renderDSDByName,
  registerAdapter,
  type SafeHtml,
  type UnsafeHtml,
  type RenderAdapter,
} from '../src/render-dsd.ts';

// ─── Helpers ──────────────────────────────────────────────────

/** Create a minimal component class for testing — no HTMLElement needed */
function createComponentClass(
  renderContent: string,
  extra?: {
    layer?: 'dsd-static' | 'dsd-interactive' | 'pure-island';
    delegatesFocus?: boolean;
    serializable?: boolean;
    slotAssignment?: 'named' | 'manual';
    customElementRegistry?: string;
  },
): CustomElementConstructor {
  // Use a plain function-based constructor to avoid needing HTMLElement
  function TestComponent(this: Record<string, unknown>) {
    if (extra?.layer) this.layer = extra.layer;
  }
  TestComponent.prototype.render = function () {
    return renderContent;
  };
  if (extra?.delegatesFocus) (TestComponent as unknown as Record<string, unknown>).delegatesFocus = true;
  if (extra?.serializable) (TestComponent as unknown as Record<string, unknown>).serializable = true;
  if (extra?.slotAssignment) (TestComponent as unknown as Record<string, unknown>).slotAssignment = extra.slotAssignment;
  if (extra?.customElementRegistry) (TestComponent as unknown as Record<string, unknown>).customElementRegistry = extra.customElementRegistry;
  return TestComponent as unknown as CustomElementConstructor;
}

/** Mock customElements registry for renderDSDByName and nested tests */
const mockRegistry = new Map<string, CustomElementConstructor>();

function setupMockCustomElements() {
  mockRegistry.clear();
  const mockCE = {
    get: (name: string) => mockRegistry.get(name),
    define: (name: string, ctor: CustomElementConstructor) => { mockRegistry.set(name, ctor); },
  } as unknown as CustomElementRegistry;
  Object.defineProperty(globalThis, 'customElements', {
    value: mockCE,
    writable: true,
    configurable: true,
  });
}

// ─── escapeAttrValue ───────────────────────────────────────────

Deno.test('escapeAttrValue', async (t) => {
  await t.step('returns empty string for null', () => {
    assertEquals(escapeAttrValue(null), '');
  });

  await t.step('returns empty string for undefined', () => {
    assertEquals(escapeAttrValue(undefined), '');
  });

  await t.step('escapes & in attribute values', () => {
    assertEquals(escapeAttrValue('a&b'), 'a&amp;b');
  });

  await t.step('escapes double quotes in attribute values', () => {
    assertEquals(escapeAttrValue('he said "hello"'), 'he said &quot;hello&quot;');
  });

  await t.step('escapes single quotes in attribute values', () => {
    assertEquals(escapeAttrValue("it's"), "it&#39;s");
  });

  await t.step('escapes < and > in attribute values', () => {
    assertEquals(escapeAttrValue('<script>'), '&lt;script&gt;');
  });

  await t.step('converts numbers to strings and escapes', () => {
    assertEquals(escapeAttrValue(42), '42');
  });

  await t.step('converts booleans to strings', () => {
    assertEquals(escapeAttrValue(true), 'true');
  });

  await t.step('returns empty string for empty string input', () => {
    assertEquals(escapeAttrValue(''), '');
  });

  await t.step('handles already-safe strings as-is', () => {
    assertEquals(escapeAttrValue('hello world'), 'hello world');
  });
});

// ─── escapeAttr ────────────────────────────────────────────────

Deno.test('escapeAttr', async (t) => {
  await t.step('escapes ampersands', () => {
    assertEquals(escapeAttr('a&b'), 'a&amp;b');
  });

  await t.step('escapes double quotes', () => {
    assertEquals(escapeAttr('he said "hello"'), 'he said &quot;hello&quot;');
  });

  await t.step('escapes single quotes', () => {
    assertEquals(escapeAttr("it's"), "it&#39;s");
  });

  await t.step('escapes angle brackets', () => {
    assertEquals(escapeAttr('<script>'), '&lt;script&gt;');
  });

  await t.step('leaves safe strings unchanged', () => {
    assertEquals(escapeAttr('hello world'), 'hello world');
  });

  await t.step('escapes all special characters together', () => {
    assertEquals(
      escapeAttr('<a href="x&y">'),
      '&lt;a href=&quot;x&amp;y&quot;&gt;',
    );
  });
});

// ─── escapeHtml ────────────────────────────────────────────────

Deno.test('escapeHtml', async (t) => {
  await t.step('escapes & to &amp;', () => {
    assertEquals(escapeHtml('a & b'), 'a &amp; b');
  });

  await t.step('escapes < to &lt;', () => {
    assertEquals(escapeHtml('<div>'), '&lt;div&gt;');
  });

  await t.step('escapes > to &gt;', () => {
    assertEquals(escapeHtml('a>b'), 'a&gt;b');
  });

  await t.step('escapes " to &quot;', () => {
    assertEquals(escapeHtml('say "hi"'), 'say &quot;hi&quot;');
  });

  await t.step("escapes ' to &#39;", () => {
    assertEquals(escapeHtml("it's"), "it&#39;s");
  });

  await t.step('escapes all five special characters at once', () => {
    assertEquals(
      escapeHtml("<a href=\"x&y\">it's</a>"),
      "&lt;a href=&quot;x&amp;y&quot;&gt;it&#39;s&lt;/a&gt;",
    );
  });

  await t.step('returns empty string for non-string input', () => {
    // @ts-expect-error testing runtime safety
    assertEquals(escapeHtml(123 as string), '');
  });

  await t.step('preserves safe strings unchanged', () => {
    assertEquals(escapeHtml('hello world'), 'hello world');
  });
});

// ─── renderDSD — basic rendering ───────────────────────────────

Deno.test('renderDSD — basic rendering', async (t) => {
  await t.step('renders a simple component with DSD template', async () => {
    const Cls = createComponentClass('<p>Hello</p>');
    const html = await renderDSD('test-comp', Cls);
    assertStringIncludes(html, '<test-comp>');
    assertStringIncludes(html, '<template shadowrootmode="open">');
    assertStringIncludes(html, '<p>Hello</p>');
    assertStringIncludes(html, '</template>');
    assertStringIncludes(html, '</test-comp>');
  });

  await t.step('renders component with props as attributes', async () => {
    const Cls = createComponentClass('<span>test</span>');
    const html = await renderDSD('test-comp', Cls, { name: 'LessJS' });
    assertStringIncludes(html, 'name="LessJS"');
  });

  await t.step('includes data-ssr-props when props are provided', async () => {
    const Cls = createComponentClass('');
    const html = await renderDSD('test-comp', Cls, { count: 5 });
    assertStringIncludes(html, 'data-ssr-props=');
  });

  await t.step('does not include data-ssr-props when no props', async () => {
    const Cls = createComponentClass('<div>no props</div>');
    const html = await renderDSD('test-comp', Cls);
    assertFalse(html.includes('data-ssr-props'));
  });

  await t.step('skips false/null/undefined props in attributes', async () => {
    const Cls = createComponentClass('');
    const html = await renderDSD('test-comp', Cls, {
      active: false,
      hidden: null,
      empty: undefined,
    });
    assertNotMatch(html, /active="false"/);
    assertNotMatch(html, /hidden="null"/);
    assertNotMatch(html, /empty="undefined"/);
  });

  await t.step('renders boolean true as bare attribute', async () => {
    const Cls = createComponentClass('');
    const html = await renderDSD('test-comp', Cls, { disabled: true });
    assertStringIncludes(html, 'disabled');
    assertNotMatch(html, /disabled="true"/);
  });

  await t.step('serializes object props as JSON in attribute', async () => {
    const Cls = createComponentClass('');
    const html = await renderDSD('test-comp', Cls, { items: [1, 2, 3] });
    assertStringIncludes(html, 'data-ssr-props=');
  });
});

// ─── renderDSD — error handling ────────────────────────────────

Deno.test('renderDSD — error handling', async (t) => {
  await t.step('handles component that throws on instantiation', async () => {
    function BadComp(this: Record<string, unknown>) {
      throw new Error('ctor failed');
    }
    const html = await renderDSD('bad-comp', BadComp as unknown as CustomElementConstructor);
    assertStringIncludes(html, 'LessJS ERROR');
    assertStringIncludes(html, 'ctor failed');
  });

  await t.step('handles render() that throws', async () => {
    function ErrorComp(this: Record<string, unknown>) {}
    ErrorComp.prototype.render = function () {
      throw new Error('render boom');
    };
    const html = await renderDSD('error-comp', ErrorComp as unknown as CustomElementConstructor);
    assertStringIncludes(html, 'LessJS ERROR');
    assertStringIncludes(html, 'render boom');
  });

  await t.step('handles render() that returns null', async () => {
    const Cls = createComponentClass('');
    // Override render to return null
    (Cls as unknown as { prototype: { render: () => null } }).prototype.render = () => null;
    const html = await renderDSD('null-comp', Cls);
    assertStringIncludes(html, '<template shadowrootmode="open">');
    assertStringIncludes(html, '</null-comp>');
  });

  await t.step('handles render() that returns non-string without adapter', async () => {
    function ObjComp(this: Record<string, unknown>) {}
    ObjComp.prototype.render = function () {
      return { weird: true };
    };
    const html = await renderDSD('obj-comp', ObjComp as unknown as CustomElementConstructor);
    assertStringIncludes(html, 'LessJS ERROR');
    assertStringIncludes(html, 'expected string');
  });
});

// ─── renderDSD — DSD options ──────────────────────────────────

Deno.test('renderDSD — DSD options', async (t) => {
  await t.step('adds shadowrootdelegatesfocus when delegatesFocus=true', async () => {
    const Cls = createComponentClass('<input />');
    const html = await renderDSD('focus-comp', Cls, {}, undefined, { delegatesFocus: true });
    assertStringIncludes(html, 'shadowrootdelegatesfocus');
  });

  await t.step('adds shadowrootserializable when serializable=true', async () => {
    const Cls = createComponentClass('<div>ser</div>');
    const html = await renderDSD('ser-comp', Cls, {}, undefined, { serializable: true });
    assertStringIncludes(html, 'shadowrootserializable');
  });

  await t.step('adds shadowrootslotassignment when slotAssignment=manual', async () => {
    const Cls = createComponentClass('<slot></slot>');
    const html = await renderDSD('slot-comp', Cls, {}, undefined, { slotAssignment: 'manual' });
    assertStringIncludes(html, 'shadowrootslotassignment="manual"');
  });

  await t.step('adds shadowrootcustomelementregistry when specified', async () => {
    const Cls = createComponentClass('<div>reg</div>');
    const html = await renderDSD('reg-comp', Cls, {}, undefined, { customElementRegistry: 'my-scope' });
    assertStringIncludes(html, 'shadowrootcustomelementregistry="my-scope"');
  });

  await t.step('omits DSD attrs when options are not set', async () => {
    const Cls = createComponentClass('<div>plain</div>');
    const html = await renderDSD('plain-comp', Cls);
    assertStringIncludes(html, 'shadowrootmode="open"');
    assertFalse(html.includes('shadowrootdelegatesfocus'));
    assertFalse(html.includes('shadowrootserializable'));
    assertFalse(html.includes('shadowrootslotassignment'));
  });

  await t.step('includes multiple DSD attrs at once', async () => {
    const Cls = createComponentClass('<div>multi</div>');
    const html = await renderDSD('multi-comp', Cls, {}, undefined, {
      delegatesFocus: true,
      serializable: true,
    });
    assertStringIncludes(html, 'shadowrootdelegatesfocus');
    assertStringIncludes(html, 'shadowrootserializable');
  });
});

// ─── renderDSD — pure-island layer ─────────────────────────────

Deno.test('renderDSD — pure-island layer', async (t) => {
  await t.step('skips DSD template for pure-island layer', async () => {
    const Cls = createComponentClass('<button>Click</button>');
    const html = await renderDSD('island-comp', Cls, {}, undefined, { layer: 'pure-island' });
    assertStringIncludes(html, '<island-comp');
    assertNotMatch(html, /shadowrootmode/);
    assertStringIncludes(html, '</island-comp>');
  });

  await t.step('pure-island includes data-ssr-props for hydration', async () => {
    const Cls = createComponentClass('');
    const html = await renderDSD('hyd-comp', Cls, { count: 5 }, undefined, { layer: 'pure-island' });
    assertStringIncludes(html, 'data-ssr-props=');
  });

  await t.step('pure-island includes attributes from props', async () => {
    const Cls = createComponentClass('');
    const html = await renderDSD('attr-comp', Cls, { label: 'test' }, undefined, { layer: 'pure-island' });
    assertStringIncludes(html, 'label="test"');
  });

  await t.step('pure-island respects instance.layer property', async () => {
    const Cls = createComponentClass('<span>Island</span>', { layer: 'pure-island' });
    const html = await renderDSD('inst-comp', Cls);
    assertNotMatch(html, /shadowrootmode/);
  });
});

// ─── renderDSD — source info ─────────────────────────────────

Deno.test('renderDSD — source info', async (t) => {
  await t.step('includes route source info in error output', async () => {
    function BadComp(this: Record<string, unknown>) {
      throw new Error('ctor failed');
    }
    const html = await renderDSD('bad-comp', BadComp as unknown as CustomElementConstructor, {}, { route: '/test' });
    assertStringIncludes(html, 'Route: /test');
  });

  await t.step('includes source file info in error output', async () => {
    function BadComp(this: Record<string, unknown>) {
      throw new Error('ctor failed');
    }
    const html = await renderDSD('bad-comp', BadComp as unknown as CustomElementConstructor, {}, { source: 'test.ts' });
    assertStringIncludes(html, 'Source: test.ts');
  });

  await t.step('source info appears in element open tag', async () => {
    function BadComp(this: Record<string, unknown>) {
      throw new Error('ctor failed');
    }
    const html = await renderDSD('bad-comp', BadComp as unknown as CustomElementConstructor, {}, { route: '/test', source: 'test.ts' });
    assertStringIncludes(html, '<bad-comp');
    assertStringIncludes(html, 'LessJS ERROR');
  });
});

// ─── renderDSDByName ───────────────────────────────────────────

Deno.test('renderDSDByName', async (t) => {
  await t.step('renders registered custom element by name', async () => {
    const savedCE = globalThis.customElements;
    setupMockCustomElements();
    try {
      const Cls = createComponentClass('<span>Named</span>');
      mockRegistry.set('named-comp', Cls);

      const html = await renderDSDByName('named-comp', { label: 'test' });
      assertStringIncludes(html, '<named-comp');
      assertStringIncludes(html, 'label="test"');
      assertStringIncludes(html, '<span>Named</span>');
    } finally {
      Object.defineProperty(globalThis, 'customElements', {
        value: savedCE,
        writable: true,
        configurable: true,
      });
    }
  });

  await t.step('renders void element for unregistered tag', async () => {
    const savedCE = globalThis.customElements;
    setupMockCustomElements();
    try {
      const html = await renderDSDByName('nonexistent-tag-xyz', { foo: 'bar' });
      assertStringIncludes(html, '<nonexistent-tag-xyz');
      assertStringIncludes(html, 'foo="bar"');
      assertStringIncludes(html, '</nonexistent-tag-xyz>');
    } finally {
      Object.defineProperty(globalThis, 'customElements', {
        value: savedCE,
        writable: true,
        configurable: true,
      });
    }
  });

  await t.step('passes props through to renderDSD', async () => {
    const savedCE = globalThis.customElements;
    setupMockCustomElements();
    try {
      const Cls = createComponentClass('<div>props</div>');
      mockRegistry.set('props-comp', Cls);

      const html = await renderDSDByName('props-comp', { count: 10, active: true });
      assertStringIncludes(html, 'data-ssr-props=');
    } finally {
      Object.defineProperty(globalThis, 'customElements', {
        value: savedCE,
        writable: true,
        configurable: true,
      });
    }
  });
});

// ─── renderDSD — adapter protocol ──────────────────────────────

Deno.test('renderDSD — adapter protocol', async (t) => {
  await t.step('uses adapter to render non-string template results', async () => {
    const mockTemplate = { _$litType$: 1, values: ['hello'] };
    const adapter: RenderAdapter = {
      isTemplate: (v) => typeof v === 'object' && v !== null && '_$litType$' in v,
      render: async (_v, tag) => `<adapted>${tag}</adapted>`,
    };
    registerAdapter(adapter);

    function LitLikeComp(this: Record<string, unknown>) {}
    LitLikeComp.prototype.render = function () {
      return mockTemplate;
    };

    try {
      const html = await renderDSD('lit-comp', LitLikeComp as unknown as CustomElementConstructor);
      assertStringIncludes(html, '<adapted>lit-comp</adapted>');
    } finally {
      registerAdapter(undefined);
    }
  });

  await t.step('adapter extractStyles injects <style> into template', async () => {
    const adapter: RenderAdapter = {
      extractStyles: () => ':host { display: block; }',
    };
    registerAdapter(adapter);

    const Cls = createComponentClass('<div>styled</div>');
    try {
      const html = await renderDSD('styled-comp', Cls);
      assertStringIncludes(html, '<style>:host { display: block; }</style>');
    } finally {
      registerAdapter(undefined);
    }
  });

  await t.step('adapter extractStyles failure is handled gracefully', async () => {
    const adapter: RenderAdapter = {
      extractStyles: () => {
        throw new Error('style extraction failed');
      },
    };
    registerAdapter(adapter);

    const Cls = createComponentClass('<div>graceful</div>');
    try {
      // Should not throw — style extraction failure is caught
      const html = await renderDSD('graceful-comp', Cls);
      assertStringIncludes(html, '<div>graceful</div>');
    } finally {
      registerAdapter(undefined);
    }
  });
});

// ─── renderDSD — edge cases ────────────────────────────────────

Deno.test('renderDSD — edge cases', async (t) => {
  await t.step('handles empty render output', async () => {
    const Cls = createComponentClass('');
    const html = await renderDSD('empty-comp', Cls);
    assertStringIncludes(html, '<empty-comp>');
    assertStringIncludes(html, '</empty-comp>');
  });

  await t.step('handles component with read-only property', async () => {
    function ReadOnlyComp(this: Record<string, unknown>) {}
    ReadOnlyComp.prototype.render = function () { return '<div>readonly</div>'; };
    // Make 'immutable' a getter-only property on the prototype
    Object.defineProperty(ReadOnlyComp.prototype, 'immutable', {
      get() { return 'fixed'; },
      configurable: true,
    });

    const html = await renderDSD('readonly-comp', ReadOnlyComp as unknown as CustomElementConstructor, { immutable: 'changed' });
    assertStringIncludes(html, 'shadowrootmode="open"');
    assertStringIncludes(html, '<div>readonly</div>');
  });

  await t.step('handles props with special characters in values', async () => {
    const Cls = createComponentClass('');
    const html = await renderDSD('special-comp', Cls, { text: '<script>alert("xss")</script>' });
    // Attribute values should be escaped
    assertNotMatch(html, /<script>alert/);
  });

  await t.step('handles deeply nested HTML content', async () => {
    const Cls = createComponentClass('<div><span><a href="#">deep</a></span></div>');
    const html = await renderDSD('nested-comp', Cls);
    assertStringIncludes(html, '<a href="#">deep</a>');
  });

  await t.step('handles component with very large attribute value', async () => {
    const Cls = createComponentClass('');
    const bigValue = 'x'.repeat(10000);
    const html = await renderDSD('big-comp', Cls, { data: bigValue });
    assertStringIncludes(html, 'data-ssr-props=');
  });

  await t.step('dsd-interactive layer still emits DSD template', async () => {
    const Cls = createComponentClass('<button>Click</button>');
    const html = await renderDSD('interactive-comp', Cls, {}, undefined, { layer: 'dsd-interactive' });
    assertStringIncludes(html, 'shadowrootmode="open"');
  });
});

// ─── XSS safety ────────────────────────────────────────────────

Deno.test('escapeHtml prevents XSS injection', () => {
  const malicious = '<img src=x onerror=alert(1)>';
  const escaped = escapeHtml(malicious);
  assertNotMatch(escaped, /</);
  assertNotMatch(escaped, />/);
  assertEquals(escaped, '&lt;img src=x onerror=alert(1)&gt;');
});

Deno.test('escapeAttrValue prevents attribute injection', () => {
  const malicious = '" onclick="alert(1)';
  const escaped = escapeAttrValue(malicious);
  assertNotMatch(escaped, /"/);
  assertEquals(escaped, '&quot; onclick=&quot;alert(1)');
});
