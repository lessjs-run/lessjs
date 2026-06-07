/**
 * VNode Render Benchmarks — v0.35.6 (Cell 006)
 *
 * Benchmarks VNode creation and the isVNode type guard used in the
 * openElement rendering pipeline.
 *
 * Run: deno bench bench/render.bench.ts
 */

import { isVNode, type VNode } from '@openelement/core';

/** Helper: create a VNode (equivalent to JSX output). */
function h(
  tag: string,
  props: Record<string, unknown> = {},
  ...children: (VNode | string)[]
): VNode {
  return { tag, props, children };
}

// Simple VNode creation (JSX equivalent of <div>Hello</div>)
Deno.bench('VNode — simple div', () => {
  h('div', {}, 'Hello');
});

// Nested VNodes
Deno.bench('VNode — nested (5 levels)', () => {
  h('div', {}, h('section', {}, h('article', {}, h('p', {}, h('span', {}, 'Deep content')))));
});

// Siblings
Deno.bench('VNode — 10 siblings', () => {
  h('ul', {}, ...Array.from({ length: 10 }, (_, i) => h('li', { key: String(i) }, `Item ${i}`)));
});

// Attributes
Deno.bench('VNode — with attributes', () => {
  h('a', {
    href: 'https://example.com',
    class: 'link',
    target: '_blank',
    'data-id': '123',
  }, 'Click me');
});

// Mixed content (text + elements)
Deno.bench('VNode — mixed content', () => {
  h(
    'div',
    {},
    'Hello ',
    h('strong', {}, 'world'),
    '! Welcome to ',
    h('em', {}, 'openElement'),
    '.',
  );
});

// Type guard
const testNode: VNode = { tag: 'div', props: {}, children: ['test'] };
const notNode = { foo: 'bar' };

Deno.bench('isVNode — valid node', () => {
  isVNode(testNode);
});

Deno.bench('isVNode — invalid object', () => {
  isVNode(notNode);
});

Deno.bench('isVNode — primitives', () => {
  isVNode(null);
  isVNode(42);
  isVNode('string');
});
