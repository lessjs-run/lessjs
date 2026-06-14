/**
 * @openelement/core - JSX renderDsdTree tests.
 *
 * v0.24.3: Direct tests for SSR renderer: Signal unwrap, SVG attrs,
 * boolean attrs, style serialisation, event exclusion.
 */

import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { Fragment, jsx, jsxs } from '../src/jsx-runtime.ts';
import { renderDsdTree } from '../src/render-ir.ts';
import { signal } from '@openelement/signal';

Deno.test('renderDsdTree renders text', async () => {
  assertEquals(await renderDsdTree('hello'), 'hello');
});

Deno.test('renderDsdTree renders number', async () => {
  assertEquals(await renderDsdTree(42), '42');
});

Deno.test('renderDsdTree renders null as empty', async () => {
  assertEquals(await renderDsdTree(null), '');
});

Deno.test('renderDsdTree unwraps Signal children', async () => {
  const s = signal('world');
  assertEquals(await renderDsdTree(s), 'world');
});

Deno.test('renderDsdTree basic element', async () => {
  const vnode = jsx('div', { id: 'x' });
  assertEquals(await renderDsdTree(vnode), '<div id="x"></div>');
});

Deno.test('renderDsdTree element with text child', async () => {
  const vnode = jsx('p', { children: ['hello'] });
  assertEquals(await renderDsdTree(vnode), '<p>hello</p>');
});

Deno.test('renderDsdTree element with Signal child', async () => {
  const s = signal('dynamic');
  const vnode = jsx('span', { children: [s] });
  assertEquals(await renderDsdTree(vnode), '<span>dynamic</span>');
});

Deno.test('renderDsdTree excludes onClick handler', async () => {
  const vnode = jsx('button', { onClick: () => {}, children: ['Click'] });
  const html = await renderDsdTree(vnode);
  assertStringIncludes(html, '<button');
  // onClick must not appear as an HTML attribute name
  assertEquals(html.includes('onClick="'), false);
  assertEquals(html.includes('onclick="'), false);
  assertStringIncludes(html, 'data-eid="e0"');
  assertEquals(html.includes('data-on-click='), false);
});

Deno.test('renderDsdTree className maps to class', async () => {
  const vnode = jsx('div', { className: 'foo bar' });
  assertEquals(await renderDsdTree(vnode), '<div class="foo bar"></div>');
});

Deno.test('renderDsdTree htmlFor maps to for', async () => {
  const vnode = jsx('label', { htmlFor: 'input-id', children: ['Label'] });
  assertEquals(await renderDsdTree(vnode), '<label for="input-id">Label</label>');
});

Deno.test('renderDsdTree boolean true emits attribute', async () => {
  const vnode = jsx('input', { disabled: true });
  assertEquals(await renderDsdTree(vnode), '<input disabled>');
});

Deno.test('renderDsdTree boolean false omits attribute', async () => {
  const vnode = jsx('input', { disabled: false });
  assertEquals(await renderDsdTree(vnode), '<input>');
});

Deno.test('renderDsdTree style object serialises', async () => {
  const vnode = jsx('div', { style: { color: 'red', fontSize: '16px' } });
  const html = await renderDsdTree(vnode);
  assertStringIncludes(html, 'style=');
  assertStringIncludes(html, 'color: red');
  assertStringIncludes(html, 'font-size: 16px');
});

Deno.test('renderDsdTree SVG attributes preserved', async () => {
  const vnode = jsx('svg', {
    viewBox: '0 0 16 16',
    fill: 'none',
    children: [
      jsx('circle', { cx: '8', cy: '8', r: '3' }),
    ],
  });
  const html = await renderDsdTree(vnode);
  assertStringIncludes(html, 'viewBox="0 0 16 16"');
  assertStringIncludes(html, '<circle');
});

Deno.test('renderDsdTree SVG stroke-width attribute', async () => {
  const vnode = jsx('svg', {
    children: [
      jsx('line', { 'stroke-width': '1.5', x1: '0', y1: '0', x2: '10', y2: '10' }),
    ],
  });
  const html = await renderDsdTree(vnode);
  assertStringIncludes(html, 'stroke-width="1.5"');
});

Deno.test('renderDsdTree Fragment concatenates children', async () => {
  const vnode = jsxs(Fragment, {
    children: [
      jsx('span', { children: ['a'] }),
      jsx('span', { children: ['b'] }),
    ],
  });
  assertEquals(await renderDsdTree(vnode), '<span>a</span><span>b</span>');
});

Deno.test('renderDsdTree void elements self-close', async () => {
  assertEquals(await renderDsdTree(jsx('br', {})), '<br>');
  assertEquals(await renderDsdTree(jsx('img', { src: 'x.png' })), '<img src="x.png">');
  assertEquals(await renderDsdTree(jsx('input', { type: 'text' })), '<input type="text">');
});

Deno.test('renderDsdTree Signal attribute (TODO: unwrap hardening Step 4)', async () => {
  // Step 4 will add Signal auto-unwrap for attributes.
  // Currently produces [object Object]; users must use .value explicitly.
  const s = signal('tooltip');
  const vnode = jsx('button', { title: s.value as unknown as string, children: ['Hover'] });
  const html = await renderDsdTree(vnode);
  assertStringIncludes(html, 'title="tooltip"');
});

Deno.test('renderDsdTree multiple children with signals', async () => {
  const a = signal('hello');
  const b = signal('world');
  const vnode = jsx('div', { children: [a, ' ', b] });
  assertEquals(await renderDsdTree(vnode), '<div>hello world</div>');
});

Deno.test('renderDsdTree nested elements', async () => {
  const vnode = jsx('ul', {
    children: [
      jsx('li', { children: ['a'] }),
      jsx('li', { children: ['b'] }),
    ],
  });
  assertEquals(await renderDsdTree(vnode), '<ul><li>a</li><li>b</li></ul>');
});

Deno.test('renderDsdTree ref callback excluded', async () => {
  let called = false;
  const vnode = jsx('div', {
    ref: () => {
      called = true;
    },
  });
  const html = await renderDsdTree(vnode);
  assertEquals(html, '<div></div>');
  // ref should NOT be called in SSR
  assertEquals(called, false);
});

Deno.test('renderDsdTree escapes Signal innerHTML values by default', async () => {
  const html = signal('<strong>ready</strong>');
  const vnode = jsx('div', { innerHTML: html });
  assertEquals(await renderDsdTree(vnode), '<div>&lt;strong&gt;ready&lt;/strong&gt;</div>');
});

Deno.test('renderDsdTree treats trustedHtml as a trusted HTML boundary', async () => {
  const html = signal('<strong>ready</strong><img src="javascript:alert(1)" onerror="x()">');
  const vnode = jsx('div', { innerHTML: html, trustedHtml: true });
  const output = await renderDsdTree(vnode);
  assertStringIncludes(output, '<strong>ready</strong>');
  assertStringIncludes(output, '<img');
  assertStringIncludes(output, 'javascript:alert(1)');
  assertStringIncludes(output, 'onerror="x()"');
});

Deno.test('renderDsdTree does not sanitize trustedHtml parser edge cases', async () => {
  const html = [
    '<a href="&#x6a;avascript:alert(1)">bad</a>',
    '<svg><a xlink:href="javascript:alert(1)">bad</a></svg>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '<math href="javascript:alert(1)">bad</math>',
    '<p data-state="ok">safe</p>',
  ].join('');
  const vnode = jsx('div', { innerHTML: html, trustedHtml: true });
  const output = await renderDsdTree(vnode);

  assertStringIncludes(output, '<p data-state="ok">safe</p>');
  assertStringIncludes(output, '&#x6a;avascript:alert(1)');
  assertStringIncludes(output, 'xlink:href="javascript:alert(1)"');
  assertStringIncludes(output, 'srcdoc=');
  assertStringIncludes(output, '<svg>');
  assertStringIncludes(output, '<iframe');
  assertStringIncludes(output, '<math');
});

Deno.test('renderDsdTree keeps custom element light DOM children in one tree', async () => {
  const previousCustomElements = globalThis.customElements;
  const registry = new Map<string, CustomElementConstructor>();

  class ShellElement {
    render() {
      return jsx('section', { children: [jsx('slot', {})] });
    }
  }

  class PageElement {
    render() {
      return jsx('article', { children: ['Page body'] });
    }
  }

  registry.set('test-shell', ShellElement as unknown as CustomElementConstructor);
  registry.set('test-page', PageElement as unknown as CustomElementConstructor);

  Object.defineProperty(globalThis, 'customElements', {
    value: {
      get: (tagName: string) => registry.get(tagName),
    },
    configurable: true,
  });

  try {
    const html = await renderDsdTree(
      jsx('test-shell', {
        currentPath: '/guide',
        children: [jsx('test-page', { title: 'Intro' })],
      }),
    );

    assertStringIncludes(html, '<test-shell');
    assertStringIncludes(html, '<template shadowrootmode="open">');
    assertStringIncludes(html, '<slot></slot>');
    assertStringIncludes(html, '<test-page');
    assertStringIncludes(html, '<article>Page body</article>');
    assertEquals(html.includes('[object Object]'), false);
    assertEquals(html.indexOf('<test-page') > html.indexOf('</template>'), true);
  } finally {
    Object.defineProperty(globalThis, 'customElements', {
      value: previousCustomElements,
      configurable: true,
    });
  }
});
