/**
 * @lessjs/core - render-dsd.ts unit tests (Deno)
 *
 * Tests for the core DSD renderer: escape functions, attribute serialization,
 * DSD rendering pipeline, DSD options, pure-island layer, adapter protocol,
 * and error handling.
 *
 * Uses plain class mocks — no browser HTMLElement needed.
 */
import { assertEquals, assertFalse, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { renderDSD, renderDSDByName } from '../src/render-dsd.ts';
import { escapeAttr, escapeAttrValue, escapeHtml } from '../src/html-escape.ts';
import { registerAdapter, type RendererProtocol } from '../src/adapter-registry.ts';

// ─── Mock Component Classes ──────────────────────────────────
//
// renderDSD() takes CustomElementConstructor but only uses new() + render().
// We create plain classes that satisfy the DsdComponent interface without
// needing browser HTMLElement (not available in Deno runtime).

interface MockComponent {
  render(): string | unknown;
  [key: string]: unknown;
  layer?: string;
}

/** Create a mock component class with a render() method */
function createMockClass(
  renderContent: string,
  extra?: {
    layer?: string;
    throwOnConstruct?: boolean;
    throwOnRender?: boolean;
    renderValue?: unknown;
    readOnlyProp?: string;
  },
): new () => MockComponent {
  if (extra?.throwOnConstruct) {
    return class {
      constructor() {
        throw new Error('Construction failed');
      }
    } as unknown as new () => MockComponent;
  }

  const layerVal = extra?.layer;
  const throwOnRender = extra?.throwOnRender;
  const renderValue = extra?.renderValue;
  const readOnlyProp = extra?.readOnlyProp;

  const cls = class {
    layer = layerVal;
    render() {
      if (throwOnRender) throw new Error('Render exploded');
      if (renderValue !== undefined) return renderValue;
      return renderContent;
    }
  };

  // If a read-only property is requested, add it via getter
  if (readOnlyProp) {
    Object.defineProperty(cls.prototype, readOnlyProp, {
      get() {
        return 'immutable';
      },
      configurable: true,
    });
  }

  return cls as unknown as new () => MockComponent;
}

/** Cast mock class to CustomElementConstructor for renderDSD */
function asCtor(cls: new () => MockComponent): CustomElementConstructor {
  return cls as unknown as CustomElementConstructor;
}

// ─── escapeAttrValue ──────────────────────────────────────────

Deno.test('escapeAttrValue', async (t) => {
  await t.step('returns empty string for null', () => {
    assertEquals(escapeAttrValue(null), '');
  });

  await t.step('returns empty string for undefined', () => {
    assertEquals(escapeAttrValue(undefined), '');
  });

  await t.step('escapes & in attribute values', () => {
    assertEquals(escapeAttrValue('foo&bar'), 'foo&amp;bar');
  });

  await t.step('escapes double quotes in attribute values', () => {
    assertEquals(escapeAttrValue('he said "hello"'), 'he said &quot;hello&quot;');
  });

  await t.step('escapes single quotes in attribute values', () => {
    assertEquals(escapeAttrValue("it's"), 'it&#39;s');
  });

  await t.step('escapes < and > in attribute values', () => {
    assertEquals(escapeAttrValue('<script>'), '&lt;script&gt;');
  });

  await t.step('converts numbers to strings', () => {
    assertEquals(escapeAttrValue(42), '42');
  });

  await t.step('converts booleans to strings', () => {
    assertEquals(escapeAttrValue(true), 'true');
    assertEquals(escapeAttrValue(false), 'false');
  });

  await t.step('returns empty string for empty string input', () => {
    assertEquals(escapeAttrValue(''), '');
  });

  await t.step('handles already-safe strings as-is', () => {
    assertEquals(escapeAttrValue('hello-world'), 'hello-world');
  });
});

// ─── escapeAttr ──────────────────────────────────────────────

Deno.test('escapeAttr', async (t) => {
  await t.step('escapes ampersands', () => {
    assertEquals(escapeAttr('a&b'), 'a&amp;b');
  });

  await t.step('escapes double quotes', () => {
    assertEquals(escapeAttr('"quoted"'), '&quot;quoted&quot;');
  });

  await t.step('escapes single quotes', () => {
    assertEquals(escapeAttr("'quoted'"), '&#39;quoted&#39;');
  });

  await t.step('escapes angle brackets', () => {
    assertEquals(escapeAttr('<>'), '&lt;&gt;');
  });

  await t.step('leaves safe strings unchanged', () => {
    assertEquals(escapeAttr('hello'), 'hello');
  });

  await t.step('escapes all special characters together', () => {
    assertEquals(
      escapeAttr('<a href="url" onclick=\'fn()\'>&amp;</a>'),
      '&lt;a href=&quot;url&quot; onclick=&#39;fn()&#39;&gt;&amp;amp;&lt;/a&gt;',
    );
  });
});

// ─── escapeHtml ──────────────────────────────────────────────

Deno.test('escapeHtml', async (t) => {
  await t.step('escapes & to &amp;', () => {
    assertEquals(escapeHtml('foo & bar'), 'foo &amp; bar');
  });

  await t.step('escapes < to &lt;', () => {
    assertEquals(escapeHtml('a < b'), 'a &lt; b');
  });

  await t.step('escapes > to &gt;', () => {
    assertEquals(escapeHtml('a > b'), 'a &gt; b');
  });

  await t.step('escapes " to &quot;', () => {
    assertEquals(escapeHtml('say "hi"'), 'say &quot;hi&quot;');
  });

  await t.step("escapes ' to &#39;", () => {
    assertEquals(escapeHtml("it's"), 'it&#39;s');
  });

  await t.step('escapes all five special characters at once', () => {
    assertEquals(
      escapeHtml(`<&"'>&>`),
      '&lt;&amp;&quot;&#39;&gt;&amp;&gt;',
    );
  });

  await t.step('preserves safe strings unchanged', () => {
    assertEquals(escapeHtml('hello world'), 'hello world');
  });
});

// ─── renderDSD — Basic rendering ─────────────────────────────

Deno.test('renderDSD — basic rendering', async (t) => {
  await t.step('renders a simple component with DSD template', async () => {
    const cls = createMockClass('<p>Hello</p>');
    const html = await renderDSD('test-comp-1', asCtor(cls), {});
    assertStringIncludes(html, '<test-comp-1>');
    assertStringIncludes(html, '<template shadowrootmode="open">');
    assertStringIncludes(html, '<p>Hello</p>');
    assertStringIncludes(html, '</template>');
    assertStringIncludes(html, '</test-comp-1>');
  });

  await t.step('renders component with props as attributes', async () => {
    const cls = createMockClass('<span>content</span>');
    const html = await renderDSD('my-el-1', asCtor(cls), { variant: 'primary', count: 5 });
    assertStringIncludes(html, 'variant="primary"');
    assertStringIncludes(html, 'count="5"');
  });

  await t.step('includes data-ssr-props when props are provided', async () => {
    const cls = createMockClass('<div>x</div>');
    const html = await renderDSD('test-el-1', asCtor(cls), { name: 'test' });
    assertStringIncludes(html, 'data-ssr-props=');
  });

  await t.step('does not include data-ssr-props when no props', async () => {
    const cls = createMockClass('<div>x</div>');
    const html = await renderDSD('test-el-2', asCtor(cls), {});
    assertFalse(html.includes('data-ssr-props'));
  });

  await t.step('skips false/null/undefined props in attributes', async () => {
    const cls = createMockClass('<div>x</div>');
    const html = await renderDSD('test-el-3', asCtor(cls), {
      active: false,
      missing: null,
      gone: undefined,
    });
    assertFalse(html.includes('active='));
    assertFalse(html.includes('missing='));
    assertFalse(html.includes('gone='));
  });

  await t.step('renders boolean true as bare attribute', async () => {
    const cls = createMockClass('<div>x</div>');
    const html = await renderDSD('test-el-4', asCtor(cls), { disabled: true });
    assertStringIncludes(html, 'disabled');
    assertFalse(html.includes('disabled="true"'));
  });

  await t.step('serializes object props as JSON in attribute', async () => {
    const cls = createMockClass('<div>x</div>');
    const html = await renderDSD('test-el-5', asCtor(cls), { items: ['a', 'b'] });
    assertStringIncludes(html, 'items="');
    assertStringIncludes(html, '[');
  });
});

// ─── renderDSD — Error handling ──────────────────────────────

Deno.test('renderDSD — error handling', async (t) => {
  await t.step('handles component that throws on instantiation', async () => {
    const cls = createMockClass('', { throwOnConstruct: true });
    const html = await renderDSD('broken-el-1', asCtor(cls), {});
    assertStringIncludes(html, '<broken-el-1>');
    assertStringIncludes(html, 'LessJS ERROR');
    assertStringIncludes(html, '</broken-el-1>');
  });

  await t.step('handles render() that throws', async () => {
    const cls = createMockClass('', { throwOnRender: true });
    const html = await renderDSD('error-el-1', asCtor(cls), {});
    assertStringIncludes(html, '<error-el-1>');
    assertStringIncludes(html, 'LessJS ERROR');
    assertStringIncludes(html, '</error-el-1>');
  });

  await t.step('handles render() that returns null', async () => {
    const cls = createMockClass('', { renderValue: null });
    const html = await renderDSD('null-el-1', asCtor(cls), {});
    assertStringIncludes(html, '<null-el-1>');
    assertStringIncludes(html, '<template shadowrootmode="open">');
    assertStringIncludes(html, '</template>');
  });

  await t.step('handles render() that returns non-string without adapter', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('', { renderValue: { notAString: true } });
    const html = await renderDSD('obj-el-1', asCtor(cls), {});
    assertStringIncludes(html, '<obj-el-1>');
    assertStringIncludes(html, 'LessJS ERROR');
  });
});

// ─── renderDSD — DSD Options ─────────────────────────────────

Deno.test('renderDSD — DSD options', async (t) => {
  await t.step('adds shadowrootdelegatesfocus when delegatesFocus=true', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<button>Click</button>');
    const html = await renderDSD('focus-el-1', asCtor(cls), {}, undefined, {
      delegatesFocus: true,
    });
    assertStringIncludes(html, 'shadowrootdelegatesfocus');
  });

  await t.step('adds shadowrootserializable when serializable=true', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<span>data</span>');
    const html = await renderDSD('serial-el-1', asCtor(cls), {}, undefined, { serializable: true });
    assertStringIncludes(html, 'shadowrootserializable');
  });

  await t.step('adds shadowrootclonable when clonable=true', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<span>clone me</span>');
    const html = await renderDSD('clone-el-1', asCtor(cls), {}, undefined, { clonable: true });
    assertStringIncludes(html, 'shadowrootclonable');
  });

  await t.step('adds shadowrootslotassignment when slotAssignment=manual', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<slot></slot>');
    const html = await renderDSD('slot-el-1', asCtor(cls), {}, undefined, {
      slotAssignment: 'manual',
    });
    assertStringIncludes(html, 'shadowrootslotassignment="manual"');
  });

  await t.step('adds boolean shadowrootcustomelementregistry when enabled', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<slot></slot>');
    const html = await renderDSD('registry-el-1', asCtor(cls), {}, undefined, {
      customElementRegistry: true,
    });
    assertStringIncludes(html, 'shadowrootcustomelementregistry');
    assertFalse(html.includes('shadowrootcustomelementregistry='));
  });

  await t.step('omits DSD attrs when options are not set', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<div>x</div>');
    const html = await renderDSD('plain-el-1', asCtor(cls), {}, undefined, {});
    assertFalse(html.includes('shadowrootdelegatesfocus'));
    assertFalse(html.includes('shadowrootclonable'));
    assertFalse(html.includes('shadowrootserializable'));
    assertFalse(html.includes('shadowrootslotassignment'));
    assertFalse(html.includes('shadowrootcustomelementregistry'));
  });

  await t.step('includes multiple DSD attrs at once', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<input />');
    const html = await renderDSD('multi-el-1', asCtor(cls), {}, undefined, {
      delegatesFocus: true,
      clonable: true,
      serializable: true,
    });
    assertStringIncludes(html, 'shadowrootdelegatesfocus');
    assertStringIncludes(html, 'shadowrootclonable');
    assertStringIncludes(html, 'shadowrootserializable');
  });
});

// ─── renderDSD — Pure Island layer ──────────────────────────

Deno.test('renderDSD — pure-island layer', async (t) => {
  await t.step('skips DSD template for pure-island layer', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<div>island</div>');
    const html = await renderDSD('island-el-1', asCtor(cls), {}, undefined, {
      layer: 'pure-island',
    });
    assertFalse(html.includes('<template shadowrootmode'));
  });

  await t.step('pure-island includes data-ssr-props for hydration', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<div>island</div>');
    const html = await renderDSD('island-el-2', asCtor(cls), { count: 3 }, undefined, {
      layer: 'pure-island',
    });
    assertStringIncludes(html, 'data-ssr-props=');
  });

  await t.step('pure-island includes attributes from props', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<div>island</div>');
    const html = await renderDSD('island-el-3', asCtor(cls), { name: 'test' }, undefined, {
      layer: 'pure-island',
    });
    assertStringIncludes(html, 'name="test"');
  });

  await t.step('pure-island respects instance.layer property', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<div>island</div>', { layer: 'pure-island' });
    const html = await renderDSD('island-el-4', asCtor(cls), {});
    assertFalse(html.includes('<template shadowrootmode'));
  });
});

// ─── renderDSD — Source info ─────────────────────────────────

Deno.test('renderDSD — source info', async (t) => {
  await t.step('includes route source info in error output', async () => {
    const cls = createMockClass('', { throwOnConstruct: true });
    const html = await renderDSD('err-el-1', asCtor(cls), {}, { route: '/about' });
    assertStringIncludes(html, 'route="/about"');
  });

  await t.step('includes source file info in error output', async () => {
    const cls = createMockClass('', { throwOnConstruct: true });
    const html = await renderDSD('err-el-2', asCtor(cls), {}, { source: 'app/routes/about.ts' });
    assertStringIncludes(html, 'source="app/routes/about.ts"');
  });

  await t.step('source info appears in element open tag', async () => {
    const cls = createMockClass('', { throwOnConstruct: true });
    const html = await renderDSD('err-el-3', asCtor(cls), {}, {
      route: '/test',
      source: 'test.ts',
    });
    assertStringIncludes(html, 'route="/test"');
    assertStringIncludes(html, 'source="test.ts"');
  });
});

// ─── renderDSDByName ─────────────────────────────────────────

Deno.test('renderDSDByName', async (t) => {
  await t.step('renders void element for unregistered tag', async () => {
    const html = await renderDSDByName('nonexistent-tag-xyz', {});
    assertStringIncludes(html, '<nonexistent-tag-xyz');
    assertStringIncludes(html, '</nonexistent-tag-xyz>');
    assertFalse(html.includes('shadowrootmode'));
  });
});

// ─── Adapter protocol ────────────────────────────────────────

Deno.test('renderDSD — adapter protocol', async (t) => {
  await t.step('uses adapter to render non-string template results', async () => {
    const fakeTemplate = { _$litType$: 1, __brand: 'TemplateResult' };
    let renderCalled = false;

    const adapter: RendererProtocol = {
      name: 'test',
      isTemplate: (value: unknown) =>
        typeof value === 'object' && value !== null &&
        '_$litType$' in (value as Record<string, unknown>),
      render: (_value: unknown, _tagName: string): Promise<string> => {
        renderCalled = true;
        return Promise.resolve('<p>adapted</p>');
      },
    };

    registerAdapter(adapter);

    const cls = createMockClass('', { renderValue: fakeTemplate });
    const html = await renderDSD('adapter-el-1', asCtor(cls), {});
    assertStringIncludes(html, '<p>adapted</p>');
    assertEquals(renderCalled, true);

    registerAdapter(undefined);
  });

  await t.step('adapter extractStyles injects <style> into template', async () => {
    const adapter: RendererProtocol = {
      name: 'test',
      extractStyles: (_cls: CustomElementConstructor) => ':host { display: block; }',
    };

    registerAdapter(adapter);

    const cls = createMockClass('<div>styled</div>');
    const html = await renderDSD('styled-el-1', asCtor(cls), {});
    assertStringIncludes(html, '<style>');
    assertStringIncludes(html, ':host { display: block; }');

    registerAdapter(undefined);
  });

  await t.step('adapter extractStyles failure is handled gracefully', async () => {
    const adapter: RendererProtocol = {
      name: 'test',
      extractStyles: () => {
        throw new Error('Style extraction blew up');
      },
    };

    registerAdapter(adapter);

    const cls = createMockClass('<div>no-style</div>');
    const html = await renderDSD('no-style-el-1', asCtor(cls), {});
    assertStringIncludes(html, '<div>no-style</div>');
    assertFalse(html.includes('<style>'));

    registerAdapter(undefined);
  });
});

// ─── Edge cases ──────────────────────────────────────────────

Deno.test('renderDSD — edge cases', async (t) => {
  await t.step('handles empty render output', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('');
    const html = await renderDSD('empty-el-1', asCtor(cls), {});
    assertStringIncludes(html, '<empty-el-1>');
    assertStringIncludes(html, '<template shadowrootmode="open">');
  });

  await t.step('handles component with read-only property', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<div>test</div>', { readOnlyProp: 'frozenProp' });
    // Should not throw when trying to set read-only property
    const html = await renderDSD('readonly-el-1', asCtor(cls), { frozenProp: 'newval' });
    // Component should render even if a property is read-only
    assertStringIncludes(html, 'shadowrootmode="open"');
    assertStringIncludes(html, '<div>test</div>');
  });

  await t.step('handles props with special characters in values', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<div>x</div>');
    const html = await renderDSD('special-el-1', asCtor(cls), {
      text: '<script>alert("xss")</script>',
    });
    assertStringIncludes(html, '&lt;script&gt;');
  });

  await t.step('handles deeply nested HTML content', async () => {
    registerAdapter(undefined);
    const deepContent = '<div><section><article><p><span>deep</span></p></article></section></div>';
    const cls = createMockClass(deepContent);
    const html = await renderDSD('deep-el-1', asCtor(cls), {});
    assertStringIncludes(html, deepContent);
  });

  await t.step('handles component with very large attribute value', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<div>x</div>');
    const largeVal = 'a'.repeat(10000);
    const html = await renderDSD('large-el-1', asCtor(cls), { data: largeVal });
    assertStringIncludes(html, '<template shadowrootmode="open">');
    assertStringIncludes(html, '</large-el-1>');
    assertEquals(html.length > 10000, true);
  });

  await t.step('dsd-interactive layer still emits DSD template', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<button>Click me</button>', { layer: 'dsd-interactive' });
    const html = await renderDSD('interactive-el-1', asCtor(cls), {});
    assertStringIncludes(html, '<template shadowrootmode="open">');
  });
});
