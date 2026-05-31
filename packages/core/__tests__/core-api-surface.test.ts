import { assertEquals, assertExists } from 'jsr:@std/assert@1';
import {
  DsdElement,
  Fragment,
  jsx,
  jsxs,
  renderDsd,
  renderDsdStream,
  renderToString,
} from '../src/index.ts';

Deno.test('core stable API exports v0.24.1 JSX rendering primitives', () => {
  assertEquals(typeof renderDsd, 'function');
  assertEquals(typeof renderDsdStream, 'function');
  assertEquals(typeof DsdElement, 'function');
  assertEquals(typeof jsx, 'function');
  assertEquals(typeof jsxs, 'function');
  assertEquals(typeof Fragment, 'symbol');
  assertEquals(typeof renderToString, 'function');
});

Deno.test('core JSX to HTML string round-trip', () => {
  // v0.24.1: jsx() creates VNode, renderToString serialises to HTML
  const vnode = jsx('p', { className: 'greeting', children: 'hello' });
  const html = renderToString(vnode);
  assertEquals(html, '<p class="greeting">hello</p>');
});

Deno.test('core Fragment renders children without wrapper', () => {
  const vnode = jsxs(Fragment, { children: ['a', 'b'] });
  const html = renderToString(vnode);
  assertEquals(html, 'ab');
});

Deno.test('core renderToString escapes HTML in text content', () => {
  const vnode = jsx('div', { children: '<script>alert(1)</script>' });
  const html = renderToString(vnode);
  assertEquals(html, '<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>');
});

Deno.test('core JSX boolean attributes', () => {
  // Boolean true → attribute present without value
  const vnode = jsx('input', { disabled: true, type: 'text' });
  const html = renderToString(vnode);
  assertEquals(html, '<input disabled type="text">');
});

Deno.test('core JSX boolean false omits attribute', () => {
  const vnode = jsx('button', { disabled: false, type: 'button' });
  const html = renderToString(vnode);
  assertEquals(html, '<button type="button"></button>');
});

Deno.test('core JSX event handlers are excluded from SSR output', () => {
  const handler = () => {};
  const vnode = jsx('button', { onClick: handler, type: 'button', children: 'Click' });
  const html = renderToString(vnode);
  // onClick must NOT appear as a raw HTML attribute name
  assertEquals(html.includes('onClick="'), false);
  // v0.28.1 (ADR-0068): data-less-e marker emitted for VNode-based event hydration
  assertEquals(html.includes('data-less-e="'), true);
  assertEquals(html.includes('<button type="button"'), true);
});

Deno.test('core DsdElement and renderDsd are callable', () => {
  assertExists(DsdElement);
  assertExists(renderDsd);
  assertExists(renderDsdStream);
});
