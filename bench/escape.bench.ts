/**
 * HTML Escape Benchmarks — v0.35.6 (Cell 006)
 *
 * Benchmarks the single-pass HTML escaping implementation used in the
 * openElement rendering pipeline.
 *
 * Run: deno bench bench/escape.bench.ts
 */

import { escapeAttr, escapeHtml } from '@openelement/core';

const SHORT_TEXT = 'Hello World';
const MEDIUM_TEXT = 'The quick brown fox jumps over the lazy dog. '.repeat(10);
const LONG_TEXT = '<script>alert("xss")</script>'.repeat(100);
const ATTR_VALUE = 'value with "quotes" and <angle> brackets';

Deno.bench('escapeHtml — short text (no special chars)', () => {
  escapeHtml(SHORT_TEXT);
});

Deno.bench('escapeHtml — medium text (no special chars)', () => {
  escapeHtml(MEDIUM_TEXT);
});

Deno.bench('escapeHtml — long text (with XSS payload)', () => {
  escapeHtml(LONG_TEXT);
});

Deno.bench('escapeAttr — attribute value', () => {
  escapeAttr(ATTR_VALUE);
});

Deno.bench('escapeHtml — empty string', () => {
  escapeHtml('');
});

Deno.bench('escapeHtml — single special char', () => {
  escapeHtml('<');
});
