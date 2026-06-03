import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  computed,
  createContext,
  DsdElement,
  escapeAttr,
  escapeHtml,
  Fragment,
  isSignalLike,
  isVNode,
  jsx,
  jsxs,
  renderDsdTree,
  signal,
  StyleSheet,
} from '../index.ts';

const textCases = [
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['&', '&amp;'],
  ['"', '&quot;'],
  ["'", '&#39;'],
  ['plain', 'plain'],
  ['a<b', 'a&lt;b'],
  ['x&y', 'x&amp;y'],
  ['"q"', '&quot;q&quot;'],
  ["it's", 'it&#39;s'],
];

for (const [input, expected] of textCases) {
  Deno.test(`runtime: escapeHtml handles ${input}`, () => {
    assertEquals(escapeHtml(input), expected);
  });
}

for (const [input, expected] of textCases) {
  Deno.test(`runtime: escapeAttr handles ${input}`, () => {
    assertEquals(escapeAttr(input), expected);
  });
}

for (let i = 0; i < 20; i++) {
  Deno.test(`runtime: signal/computed facade updates ${i}`, () => {
    const count = signal(i);
    const doubled = computed(() => count.value * 2);
    assertEquals(doubled.value, i * 2);
    count.value = i + 1;
    assertEquals(doubled.value, (i + 1) * 2);
    assert(isSignalLike(count));
  });
}

for (let i = 0; i < 20; i++) {
  Deno.test(`runtime: jsx facade creates VNode ${i}`, async () => {
    const vnode = jsx('span', { id: `n-${i}`, children: `value-${i}` });
    assert(isVNode(vnode));
    assertEquals(vnode.tag, 'span');
    assertEquals(vnode.props.id, `n-${i}`);
    assertEquals(await renderDsdTree(vnode), `<span id="n-${i}">value-${i}</span>`);
  });
}

for (let i = 0; i < 10; i++) {
  Deno.test(`runtime: jsxs facade preserves children ${i}`, async () => {
    const vnode = jsxs('div', {
      className: 'box',
      children: [jsx('span', { children: `a-${i}` }), jsx('span', { children: `b-${i}` })],
    });
    assertStringIncludes(await renderDsdTree(vnode), `<span>a-${i}</span><span>b-${i}</span>`);
  });
}

for (let i = 0; i < 10; i++) {
  Deno.test(`runtime: Fragment facade renders child sequence ${i}`, async () => {
    const vnode = jsxs(Fragment, {
      children: [jsx('b', { children: `x-${i}` }), jsx('i', { children: `y-${i}` })],
    });
    assertEquals(await renderDsdTree(vnode), `<b>x-${i}</b><i>y-${i}</i>`);
  });
}

Deno.test('runtime: DsdElement facade exports a constructable base', () => {
  assertEquals(typeof DsdElement, 'function');
});

Deno.test('runtime: StyleSheet facade supports replaceSync and cssRules', () => {
  const sheet = new StyleSheet();
  sheet.replaceSync(':host { display: block; }');
  assertStringIncludes([...sheet.cssRules][0].cssText, 'display');
});

for (let i = 0; i < 8; i++) {
  Deno.test(`runtime: createContext returns stable symbolic key ${i}`, () => {
    const key = Symbol(`ctx-${i}`);
    const ctx = createContext(key, i);
    assertEquals(ctx.key, key);
    assertEquals(ctx.defaultValue, i);
  });
}
