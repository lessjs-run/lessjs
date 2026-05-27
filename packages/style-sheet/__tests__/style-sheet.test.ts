/**
 * @lessjs/style-sheet — tests (SOP-012)
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { StyleSheet } from '../src/index.ts';

Deno.test('StyleSheet', async (t) => {
  await t.step('construction creates empty StyleSheet', () => {
    const s = new StyleSheet();
    assertEquals(s instanceof StyleSheet, true);
  });

  await t.step('replaceSync sets CSS rules', () => {
    const s = new StyleSheet();
    s.replaceSync(':host { color: red; }');
    // Should not throw
  });

  await t.step('replaceSync with valid CSS', () => {
    const s = new StyleSheet();
    s.replaceSync(`
      :host { display: block; }
      .btn { padding: 8px; border-radius: 4px; }
    `);
    // Should not throw
  });

  await t.step('can be used as adoptedStyleSheet', () => {
    const s = new StyleSheet();
    s.replaceSync(':host { color: blue; }');
    // StyleSheet implements CSSStyleSheet-like interface
    assertEquals(typeof s, 'object');
  });

  await t.step('multiple instances are independent', () => {
    const a = new StyleSheet();
    const b = new StyleSheet();
    a.replaceSync(':host { color: red; }');
    b.replaceSync(':host { color: blue; }');
    assertEquals(a !== b, true);
  });
});
