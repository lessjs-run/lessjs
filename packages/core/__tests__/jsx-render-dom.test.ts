/**
 * @lessjs/core - JSX renderToDOM tests (v0.24.3).
 *
 * Uses happy-dom for DOM simulation. Dynamic imports after globalThis setup
 * so that renderToDOM's document global is available.
 */

import { assert, assertEquals } from 'jsr:@std/assert@1';
import { Window } from 'happy-dom';

// ── DOM setup (must run before dynamic imports) ──────────────────────────
const window = new Window();
Object.assign(globalThis, {
  window,
  document: window.document,
  HTMLElement: window.HTMLElement,
  AbortController: window.AbortController,
});

const { jsx, jsxs, Fragment } = await import('../src/jsx-runtime.ts');
const { renderToDOM } = await import('../src/jsx-render-dom.ts');
const { isVNode } = await import('../src/vnode.ts');
const { signal } = await import('../../signals/src/framework.ts');

Deno.test('renderToDOM renders text node', () => {
  const node = renderToDOM('hello');
  assertEquals(node.nodeType, 3);
  assertEquals(node.textContent, 'hello');
});

Deno.test('renderToDOM renders number', () => {
  assertEquals(renderToDOM(42).textContent, '42');
});

Deno.test('renderToDOM unwraps Signal children', () => {
  const s = signal('hello');
  assertEquals(renderToDOM(s).textContent, 'hello');
});

Deno.test('renderToDOM null returns empty text', () => {
  assertEquals(renderToDOM(null).textContent, '');
});

Deno.test('renderToDOM creates HTML element', () => {
  const vnode = jsx('div', { id: 'test' });
  const el = renderToDOM(vnode) as Element;
  assertEquals(el.tagName, 'DIV');
  assertEquals(el.getAttribute('id'), 'test');
});

Deno.test('renderToDOM element with text child', () => {
  const vnode = jsx('span', { children: ['hello'] });
  assertEquals((renderToDOM(vnode) as Element).textContent, 'hello');
});

Deno.test('renderToDOM element with Signal child', () => {
  const s = signal('world');
  const vnode = jsx('span', { children: [s as unknown as string] });
  assertEquals((renderToDOM(vnode) as Element).textContent, 'world');
});

Deno.test('renderToDOM SVG namespace', () => {
  const vnode = jsx('svg', {
    viewBox: '0 0 16 16',
    children: [
      jsx('circle', { cx: '8', cy: '8', r: '3' }),
    ],
  });
  const svg = renderToDOM(vnode) as Element;
  assertEquals(svg.namespaceURI, 'http://www.w3.org/2000/svg');
  const circle = svg.firstElementChild!;
  assertEquals(circle.namespaceURI, 'http://www.w3.org/2000/svg');
});

Deno.test('renderToDOM SVG path namespace', () => {
  const vnode = jsx('svg', { children: [jsx('path', { d: 'M0 0 L10 10' })] });
  const path = (renderToDOM(vnode) as Element).firstElementChild!;
  assertEquals(path.namespaceURI, 'http://www.w3.org/2000/svg');
});

Deno.test('renderToDOM onClick via addEventListener', () => {
  let clicked = false;
  const vnode = jsx('button', {
    onClick: () => {
      clicked = true;
    },
    children: ['Click'],
  });
  const btn = renderToDOM(vnode) as HTMLButtonElement;
  btn.click();
  assertEquals(clicked, true);
});

Deno.test('renderToDOM onClick stops after AbortController abort', () => {
  const controller = new AbortController();
  let count = 0;
  const vnode = jsx('button', {
    onClick: () => {
      count++;
    },
    children: ['Click'],
  });
  const btn = renderToDOM(vnode, controller.signal) as HTMLButtonElement;
  btn.click();
  assertEquals(count, 1);
  controller.abort();
  btn.click();
  assertEquals(count, 1);
});

Deno.test('renderToDOM Fragment returns DocumentFragment', () => {
  const vnode = jsxs(Fragment, {
    children: [
      jsx('span', { children: ['a'] }),
      jsx('span', { children: ['b'] }),
    ],
  });
  const frag = renderToDOM(vnode);
  assertEquals(frag.nodeType, 11);
  assertEquals(frag.childNodes.length, 2);
});

Deno.test('renderToDOM Signal in attribute (current behavior)', () => {
  // Step 4 (v0.24.3 hardening) will add auto-unwrap for attr values.
  // For now, users must explicitly use .value in attributes.
  const s = signal('tooltip text');
  const vnode = jsx('button', { title: s.value, children: ['Hover'] });
  const el = renderToDOM(vnode) as Element;
  assertEquals(el.getAttribute('title'), 'tooltip text');
});

Deno.test('renderToDOM className → class', () => {
  const vnode = jsx('div', { className: 'foo bar' });
  assertEquals((renderToDOM(vnode) as Element).getAttribute('class'), 'foo bar');
});

Deno.test('renderToDOM multiple children', () => {
  const vnode = jsx('ul', {
    children: [
      jsx('li', { children: ['a'] }),
      jsx('li', { children: ['b'] }),
      jsx('li', { children: ['c'] }),
    ],
  });
  assertEquals((renderToDOM(vnode) as Element).children.length, 3);
});

Deno.test('renderToDOM nested SVG children namespace', () => {
  const vnode = jsx('svg', {
    children: [
      jsx('g', { children: [jsx('rect', { width: '10', height: '10' })] }),
    ],
  });
  const svg = renderToDOM(vnode) as Element;
  const g = svg.firstElementChild!;
  assertEquals(g.namespaceURI, 'http://www.w3.org/2000/svg');
  assertEquals(g.firstElementChild!.namespaceURI, 'http://www.w3.org/2000/svg');
});

Deno.test('renderToDOM isVNode type guard', () => {
  assert(isVNode(jsx('div', {})));
  assert(!isVNode('string'));
  assert(!isVNode(null));
});
