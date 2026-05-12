/**
 * Escape consistency test — ensures the escapeHtml/escapeAttr implementations
 * in @lessjs/core/render-dsd.ts and @lessjs/adapter-lit/src/ssr.ts stay in sync.
 *
 * These packages are intentionally decoupled (adapter-lit must not import core),
 * so each has its own copy of the escape functions. If either copy drifts,
 * this test will fail.
 *
 * Run: deno test packages/adapter-lit/__tests__/escape-consistency.test.ts
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { escapeAttr, escapeHtml } from '../../core/src/html-escape.ts';

import { renderLitToString } from '../src/ssr.ts';
import { html } from 'lit';

/** Strip whitespace between tags for reliable comparison */
function compactHtml(value: string): string {
  return value.replace(/>\s+</g, '><').trim();
}

// ─── Core escape function reference ──────────────────────────────

const TEST_INPUTS = [
  '',
  'hello',
  '<script>alert(1)</script>',
  'a & b < c > d "e" \'f\'',
  '&amp; already escaped',
  'emoji: 🎉 🚀',
  'null\x00byte',
  'tab\there',
  'new\nline',
  '<img src=x onerror=alert(1)>',
  '"double"',
  "'single'",
  '<>&"\'',
];

Deno.test('escapeHtml: adapter-lit output matches core implementation', () => {
  for (const input of TEST_INPUTS) {
    const coreResult = escapeHtml(input);
    // Use the adapter-lit renderer to produce output with the same input
    // as text content, then extract what was rendered
    const rendered = compactHtml(renderLitToString(html`
      <span>${input}</span>
    `));
    // The adapter should have escaped the text the same way core does
    const expected = `<span>${coreResult}</span>`;
    assertEquals(
      rendered,
      expected,
      `escapeHtml mismatch for input: ${JSON.stringify(input)}`,
    );
  }
});

Deno.test('escapeAttr: adapter-lit output matches core implementation', () => {
  for (const input of TEST_INPUTS) {
    const coreResult = escapeAttr(input);
    // Use the adapter-lit renderer to produce output with the same input
    // as an attribute value
    const rendered = compactHtml(renderLitToString(html`
      <span title="${input}"></span>
    `));
    const expected = `<span title="${coreResult}"></span>`;
    assertEquals(
      rendered,
      expected,
      `escapeAttr mismatch for input: ${JSON.stringify(input)}`,
    );
  }
});

Deno.test('escapeHtml: core handles all HTML-special characters', () => {
  assertEquals(escapeHtml('&'), '&amp;');
  assertEquals(escapeHtml('<'), '&lt;');
  assertEquals(escapeHtml('>'), '&gt;');
  assertEquals(escapeHtml('"'), '&quot;');
  assertEquals(escapeHtml("'"), '&#39;');
});

Deno.test('escapeAttr: core handles all attribute-special characters', () => {
  assertEquals(escapeAttr('&'), '&amp;');
  assertEquals(escapeAttr('"'), '&quot;');
  assertEquals(escapeAttr("'"), '&#39;');
  assertEquals(escapeAttr('<'), '&lt;');
  assertEquals(escapeAttr('>'), '&gt;');
});
