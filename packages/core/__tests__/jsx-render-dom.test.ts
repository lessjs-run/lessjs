/**
 * @lessjs/core - JSX renderToDom tests (v0.24.3).
 *
 * Uses happy-dom for DOM simulation. Dynamic imports after globalThis setup
 * so that renderToDom's document global is available.
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
const { renderToDom } = await import('../src/jsx-render-dom.ts');
const { isVNode } = await import('../src/vnode.ts');
const { signal } = await import('../../signals/src/framework.ts');

const test = (name: string, fn: () => void | Promise<void>) => {
  Deno.test({
    name,
    sanitizeOps: false,
    sanitizeResources: false,
    fn,
  });
};

test('renderToDom renders text node', () => {
  const node = renderToDom('hello');
  assertEquals(node.nodeType, 3);
  assertEquals(node.textContent, 'hello');
});

test('renderToDom renders number', () => {
  assertEquals(renderToDom(42).textContent, '42');
});

test('renderToDom unwraps Signal children', () => {
  const s = signal('hello');
  assertEquals(renderToDom(s).textContent, 'hello');
});

test('renderToDom null returns empty text', () => {
  assertEquals(renderToDom(null).textContent, '');
});

test('renderToDom creates HTML element', () => {
  const vnode = jsx('div', { id: 'test' });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.tagName, 'DIV');
  assertEquals(el.getAttribute('id'), 'test');
});

test('renderToDom element with text child', () => {
  const vnode = jsx('span', { children: ['hello'] });
  assertEquals((renderToDom(vnode) as Element).textContent, 'hello');
});

test('renderToDom element with Signal child', () => {
  const s = signal('world');
  const vnode = jsx('span', { children: [s as unknown as string] });
  assertEquals((renderToDom(vnode) as Element).textContent, 'world');
});

test('renderToDom SVG namespace', () => {
  const vnode = jsx('svg', {
    viewBox: '0 0 16 16',
    children: [
      jsx('circle', { cx: '8', cy: '8', r: '3' }),
    ],
  });
  const svg = renderToDom(vnode) as Element;
  assertEquals(svg.namespaceURI, 'http://www.w3.org/2000/svg');
  const circle = svg.firstElementChild!;
  assertEquals(circle.namespaceURI, 'http://www.w3.org/2000/svg');
});

test('renderToDom SVG path namespace', () => {
  const vnode = jsx('svg', { children: [jsx('path', { d: 'M0 0 L10 10' })] });
  const path = (renderToDom(vnode) as Element).firstElementChild!;
  assertEquals(path.namespaceURI, 'http://www.w3.org/2000/svg');
});

test('renderToDom onClick via addEventListener', () => {
  let clicked = false;
  const vnode = jsx('button', {
    onClick: () => {
      clicked = true;
    },
    children: ['Click'],
  });
  const btn = renderToDom(vnode) as HTMLButtonElement;
  btn.click();
  assertEquals(clicked, true);
});

test('renderToDom onClick stops after AbortController abort', () => {
  const controller = new AbortController();
  let count = 0;
  const vnode = jsx('button', {
    onClick: () => {
      count++;
    },
    children: ['Click'],
  });
  const btn = renderToDom(vnode, controller.signal) as HTMLButtonElement;
  btn.click();
  assertEquals(count, 1);
  controller.abort();
  btn.click();
  assertEquals(count, 1);
});

test('renderToDom Fragment returns DocumentFragment', () => {
  const vnode = jsxs(Fragment, {
    children: [
      jsx('span', { children: ['a'] }),
      jsx('span', { children: ['b'] }),
    ],
  });
  const frag = renderToDom(vnode);
  assertEquals(frag.nodeType, 11);
  assertEquals(frag.childNodes.length, 2);
});

test('renderToDom Signal in attribute (current behavior)', () => {
  // Step 4 (v0.24.3 hardening) will add auto-unwrap for attr values.
  // For now, users must explicitly use .value in attributes.
  const s = signal('tooltip text');
  const vnode = jsx('button', { title: s.value, children: ['Hover'] });
  const el = renderToDom(vnode) as Element;
  assertEquals(el.getAttribute('title'), 'tooltip text');
});

test('renderToDom className → class', () => {
  const vnode = jsx('div', { className: 'foo bar' });
  assertEquals((renderToDom(vnode) as Element).getAttribute('class'), 'foo bar');
});

test('renderToDom multiple children', () => {
  const vnode = jsx('ul', {
    children: [
      jsx('li', { children: ['a'] }),
      jsx('li', { children: ['b'] }),
      jsx('li', { children: ['c'] }),
    ],
  });
  assertEquals((renderToDom(vnode) as Element).children.length, 3);
});

test('renderToDom nested SVG children namespace', () => {
  const vnode = jsx('svg', {
    children: [
      jsx('g', { children: [jsx('rect', { width: '10', height: '10' })] }),
    ],
  });
  const svg = renderToDom(vnode) as Element;
  const g = svg.firstElementChild!;
  assertEquals(g.namespaceURI, 'http://www.w3.org/2000/svg');
  assertEquals(g.firstElementChild!.namespaceURI, 'http://www.w3.org/2000/svg');
});

test('renderToDom isVNode type guard', () => {
  assert(isVNode(jsx('div', {})));
  assert(!isVNode('string'));
  assert(!isVNode(null));
  assert(!isVNode(undefined));
  assert(!isVNode(42));
  assert(!isVNode({}));
  assert(!isVNode({ type: 'div' }));
  assert(!isVNode({ tag: 'div', props: {}, children: 'not-array' }));
  assert(!isVNode({ tag: 'div', props: null, children: [] }));
  assert(!isVNode({ tag: {}, props: {}, children: [] }));
});
