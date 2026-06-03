import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { collectEventBindings, eventMarkerId, eventTypeFromProp } from '../src/event-hydration.ts';
import { For, Fragment, jsx, jsxs, Show } from '../src/jsx-runtime.ts';
import { renderDsdTree } from '../src/render-ir.ts';

Deno.test('event hydration: event marker ids are deterministic', async () => {
  assertEquals(eventMarkerId(0), 'e0');
  assertEquals(eventMarkerId(12), 'e12');
});

Deno.test('event hydration: React-style onDoubleClick maps to native dblclick', async () => {
  assertEquals(eventTypeFromProp('onClick'), 'click');
  assertEquals(eventTypeFromProp('onDoubleClick'), 'dblclick');
  assertEquals(eventTypeFromProp('onDblclick'), 'dblclick');
  assertEquals(eventTypeFromProp('onFocusIn'), 'focusin');
  assertEquals(eventTypeFromProp('onFocusOut'), 'focusout');
  assertEquals(eventTypeFromProp('onMouseEnter'), 'mouseenter');
  assertEquals(eventTypeFromProp('onMouseLeave'), 'mouseleave');
  assertEquals(eventTypeFromProp('onPointerDown'), 'pointerdown');
  assertEquals(eventTypeFromProp('onPointerMove'), 'pointermove');
  assertEquals(eventTypeFromProp('onPointerUp'), 'pointerup');
  assertEquals(eventTypeFromProp('onPointerCancel'), 'pointercancel');
  assertEquals(eventTypeFromProp('onclick'), null);
});

Deno.test('event hydration: one marker binds every handler on the same element', async () => {
  const noop = () => {};
  const tree = jsx('button', {
    onClick: noop,
    onDoubleClick: noop,
    onFocusIn: noop,
    children: ['multi'],
  });

  const html = await renderDsdTree(tree);
  assertStringIncludes(html, 'data-eid="e0"');
  assertEquals(html.includes('data-eid="e1"'), false);

  const records = collectEventBindings(tree).get('e0') ?? [];
  assertEquals(records.map((record) => record.type), ['click', 'dblclick', 'focusin']);
});

Deno.test('event hydration: SSR markers and hydration bindings share one traversal contract', async () => {
  const noop = () => {};
  const Nested = (props: { children?: unknown }) =>
    jsxs(Fragment, {
      children: [
        jsx('span', { children: ['before'] }),
        ...(Array.isArray(props.children) ? props.children : [props.children]),
      ],
    });

  const tree = jsxs(Fragment, {
    children: [
      jsx('button', { onClick: noop, children: ['root'] }),
      jsx(Show, {
        when: true,
        children: [
          jsx('button', { onClick: noop, children: ['show'] }),
          jsx('button', { onClick: noop, children: ['hidden'] }),
        ],
      }),
      jsx(For, {
        each: ['a', 'b'],
        children: [(item: unknown) => jsx('button', { onClick: noop, children: [String(item)] })],
      }),
      jsx(Nested, {
        children: [jsx('button', { onClick: noop, children: ['nested'] })],
      }),
    ],
  });

  const html = await renderDsdTree(tree);
  for (const id of ['e0', 'e1', 'e2', 'e3', 'e4']) {
    assertStringIncludes(html, `data-eid="${id}"`);
  }
  assertEquals(html.includes('data-eid="e5"'), false);

  assertEquals([...collectEventBindings(tree).keys()], ['e0', 'e1', 'e2', 'e3', 'e4']);
});



