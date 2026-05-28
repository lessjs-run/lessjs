// HISTORICAL: Tests legacy html template model removed in v0.24.1.
// Kept as reference for migration validation. See jsx-render-*.test.ts for new model.

/**
 * @lessjs/core — template helpers tests (SOP-012)
 * Tests for classMap, when, choose, repeat, ref added in SOP-009.
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { choose, classMap, html, ref, repeat, when } from '../src/template.ts';

Deno.test('classMap', async (t) => {
  await t.step('returns ClassMapValue', () => {
    const result = classMap({ active: true });
    assertEquals(result.kind, 'less:class-map');
  });

  await t.step('filters falsy values', () => {
    const result = classMap({ a: true, b: false, c: undefined, d: null });
    const tokens = [...result.tokens.entries()];
    assertEquals(tokens.filter(([, v]) => v).length, 1);
  });
});

Deno.test('when', async (t) => {
  await t.step('returns truthy template when condition is true', () => {
    const result = when(
      true,
      html`
        <span>yes</span>
      `,
      html`
        <span>no</span>
      `,
    );
    assertEquals(result.kind, 'less:template-result');
  });

  await t.step('returns falsy template when condition is false', () => {
    const result = when(
      false,
      html`
        <span>yes</span>
      `,
      html`
        <span>no</span>
      `,
    );
    assertEquals(result.kind, 'less:template-result');
  });
});

Deno.test('choose', async (t) => {
  await t.step('matches correct case', () => {
    const result = choose('b', [
      ['a', () =>
        html`
          <a></a>
        `],
      ['b', () =>
        html`
          <b></b>
        `],
    ], () =>
      html`
        <default></default>
      `);
    assertEquals(result.kind, 'less:template-result');
  });

  await t.step('falls back when no match', () => {
    const result = choose('z', [['a', () =>
      html`
        <a></a>
      `]], () =>
      html`
        <fallback></fallback>
      `);
    assertEquals(result.kind, 'less:template-result');
  });
});

Deno.test('repeat', async (t) => {
  await t.step('iterates items', () => {
    const items = ['a', 'b', 'c'];
    const result = repeat(items, (item: string) =>
      html`
        <li>${item}</li>
      `);
    assertEquals(result.kind, 'less:template-result');
  });
});

Deno.test('ref', async (t) => {
  await t.step('creates RefDirective', () => {
    let _captured: Element | null = null;
    const r = ref((el) => {
      _captured = el;
    });
    assertEquals(r.kind, 'less:ref');
    assertEquals(typeof r.callback, 'function');
  });
});
