/**
 * @lessjs/core - JSX renderToString tests.
 *
 * v0.24.3: Direct tests for SSR renderer — Signal unwrap, SVG attrs,
 * boolean attrs, style serialisation, event exclusion.
 */

import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { Fragment, jsx, jsxs } from '../src/jsx-runtime.ts';
import { renderToString } from '../src/jsx-render-string.ts';
import { signal } from '@lessjs/signals';

Deno.test('renderToString renders text', () => {
  assertEquals(renderToString('hello'), 'hello');
});

Deno.test('renderToString renders number', () => {
  assertEquals(renderToString(42), '42');
});

Deno.test('renderToString renders null as empty', () => {
  assertEquals(renderToString(null), '');
});

Deno.test('renderToString unwraps Signal children', () => {
  const s = signal('world');
  assertEquals(renderToString(s), 'world');
});

Deno.test('renderToString basic element', () => {
  const vnode = jsx('div', { id: 'x' });
  assertEquals(renderToString(vnode), '<div id="x"></div>');
});

Deno.test('renderToString element with text child', () => {
  const vnode = jsx('p', { children: ['hello'] });
  assertEquals(renderToString(vnode), '<p>hello</p>');
});

Deno.test('renderToString element with Signal child', () => {
  const s = signal('dynamic');
  const vnode = jsx('span', { children: [s] });
  assertEquals(renderToString(vnode), '<span>dynamic</span>');
});

Deno.test('renderToString excludes onClick handler', () => {
  const vnode = jsx('button', { onClick: () => {}, children: ['Click'] });
  const html = renderToString(vnode);
  assertStringIncludes(html, '<button');
  // onClick must not appear as an HTML attribute name
  assertEquals(html.includes('onClick="'), false);
  assertEquals(html.includes('onclick="'), false);
  assertStringIncludes(html, 'data-less-e="e0"');
  assertEquals(html.includes('data-on-click='), false);
});

Deno.test('renderToString className maps to class', () => {
  const vnode = jsx('div', { className: 'foo bar' });
  assertEquals(renderToString(vnode), '<div class="foo bar"></div>');
});

Deno.test('renderToString htmlFor maps to for', () => {
  const vnode = jsx('label', { htmlFor: 'input-id', children: ['Label'] });
  assertEquals(renderToString(vnode), '<label for="input-id">Label</label>');
});

Deno.test('renderToString boolean true emits attribute', () => {
  const vnode = jsx('input', { disabled: true });
  assertEquals(renderToString(vnode), '<input disabled>');
});

Deno.test('renderToString boolean false omits attribute', () => {
  const vnode = jsx('input', { disabled: false });
  assertEquals(renderToString(vnode), '<input>');
});

Deno.test('renderToString style object serialises', () => {
  const vnode = jsx('div', { style: { color: 'red', fontSize: '16px' } });
  const html = renderToString(vnode);
  assertStringIncludes(html, 'style=');
  assertStringIncludes(html, 'color: red');
  assertStringIncludes(html, 'font-size: 16px');
});

Deno.test('renderToString SVG attributes preserved', () => {
  const vnode = jsx('svg', {
    viewBox: '0 0 16 16',
    fill: 'none',
    children: [
      jsx('circle', { cx: '8', cy: '8', r: '3' }),
    ],
  });
  const html = renderToString(vnode);
  assertStringIncludes(html, 'viewBox="0 0 16 16"');
  assertStringIncludes(html, '<circle');
});

Deno.test('renderToString SVG stroke-width attribute', () => {
  const vnode = jsx('svg', {
    children: [
      jsx('line', { 'stroke-width': '1.5', x1: '0', y1: '0', x2: '10', y2: '10' }),
    ],
  });
  const html = renderToString(vnode);
  assertStringIncludes(html, 'stroke-width="1.5"');
});

Deno.test('renderToString Fragment concatenates children', () => {
  const vnode = jsxs(Fragment, {
    children: [
      jsx('span', { children: ['a'] }),
      jsx('span', { children: ['b'] }),
    ],
  });
  assertEquals(renderToString(vnode), '<span>a</span><span>b</span>');
});

Deno.test('renderToString void elements self-close', () => {
  assertEquals(renderToString(jsx('br', {})), '<br>');
  assertEquals(renderToString(jsx('img', { src: 'x.png' })), '<img src="x.png">');
  assertEquals(renderToString(jsx('input', { type: 'text' })), '<input type="text">');
});

Deno.test('renderToString Signal attribute (TODO: unwrap hardening Step 4)', () => {
  // Step 4 will add Signal auto-unwrap for attributes.
  // Currently produces [object Object]; users must use .value explicitly.
  const s = signal('tooltip');
  const vnode = jsx('button', { title: s.value as unknown as string, children: ['Hover'] });
  const html = renderToString(vnode);
  assertStringIncludes(html, 'title="tooltip"');
});

Deno.test('renderToString multiple children with signals', () => {
  const a = signal('hello');
  const b = signal('world');
  const vnode = jsx('div', { children: [a, ' ', b] });
  assertEquals(renderToString(vnode), '<div>hello world</div>');
});

Deno.test('renderToString nested elements', () => {
  const vnode = jsx('ul', {
    children: [
      jsx('li', { children: ['a'] }),
      jsx('li', { children: ['b'] }),
    ],
  });
  assertEquals(renderToString(vnode), '<ul><li>a</li><li>b</li></ul>');
});

Deno.test('renderToString ref callback excluded', () => {
  let called = false;
  const vnode = jsx('div', {
    ref: () => {
      called = true;
    },
  });
  const html = renderToString(vnode);
  assertEquals(html, '<div></div>');
  // ref should NOT be called in SSR
  assertEquals(called, false);
});

Deno.test('renderToString unwraps Signal innerHTML values', () => {
  const html = signal('<strong>ready</strong>');
  const vnode = jsx('div', { innerHTML: html });
  assertEquals(renderToString(vnode), '<div><strong>ready</strong></div>');
});
