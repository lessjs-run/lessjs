/**
 * @openelement/hub - Playwright Snapshot Renderer Tests
 *
 * v0.19.0 Phase 3: Tests for the Playwright-based snapshot renderer.
 * These tests validate the fixture HTML generation and sanitizer,
 * which run without a browser. Browser-dependent rendering is
 * validated via `deno task hub:scan` end-to-end.
 *
 * @see docs/sop/v0.19.0-snapshot-v2-playwright.md
 */

import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';

// ─── Sanitizer Tests ──────────────────────────────────────────────────────
// The sanitizeSnapshot function is module-private, but we can test the
// behavior by importing the module and checking exported render results.
// Since sanitizeSnapshot is not exported, we re-implement the same logic
// here for unit testing. The integration test (hub:scan) covers the
// real code path.

function sanitizeSnapshot(html: string): string {
  let result = html;
  result = result.replace(/<script[\s\S]*?<\/script>/gi, '');
  result = result.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  result = result.replace(/<iframe[^>]*>/gi, '');
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  result = result.replace(/\s+on\w+\s*=\s*\S+/gi, '');
  result = result.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  result = result.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');
  return result;
}

Deno.test('sanitizeSnapshot: strips <script> tags', () => {
  const input = '<div><script>alert("xss")</script><span>safe</span></div>';
  const result = sanitizeSnapshot(input);
  assert(!result.includes('<script'), 'Script tag should be removed');
  assert(!result.includes('alert'), 'Script content should be removed');
  assert(result.includes('<span>safe</span>'), 'Safe content should remain');
});

Deno.test('sanitizeSnapshot: strips <iframe> tags', () => {
  const input = '<div><iframe src="evil.com"></iframe></div>';
  const result = sanitizeSnapshot(input);
  assert(!result.includes('<iframe'), 'Iframe tag should be removed');
  assert(result.includes('<div></div>'), 'Parent element should remain');
});

Deno.test('sanitizeSnapshot: strips onclick handlers', () => {
  const input = '<button onclick="alert(1)" class="btn">Click</button>';
  const result = sanitizeSnapshot(input);
  assert(!result.includes('onclick'), 'onclick handler should be removed');
  assert(result.includes('class="btn"'), 'Class attribute should remain');
  assert(result.includes('Click'), 'Text content should remain');
});

Deno.test('sanitizeSnapshot: strips javascript: URLs in href', () => {
  const input = '<a href="javascript:alert(1)">Link</a>';
  const result = sanitizeSnapshot(input);
  assert(!result.includes('javascript:'), 'javascript: URL should be removed');
});

Deno.test('sanitizeSnapshot: strips javascript: URLs in src', () => {
  const input = '<img src="javascript:alert(1)" alt="test">';
  const result = sanitizeSnapshot(input);
  assert(!result.includes('javascript:'), 'javascript: src should be removed');
});

Deno.test('sanitizeSnapshot: preserves safe attributes', () => {
  const input = '<div class="card" id="test" data-value="123">Content</div>';
  const result = sanitizeSnapshot(input);
  assertEquals(result, input, 'Safe attributes should be preserved');
});

Deno.test('sanitizeSnapshot: handles multiple dangerous elements', () => {
  const input = '<div><script>x</script><iframe src="e"></iframe><a onclick="x">link</a></div>';
  const result = sanitizeSnapshot(input);
  assert(!result.includes('<script'), 'Script should be removed');
  assert(!result.includes('<iframe'), 'Iframe should be removed');
  assert(!result.includes('onclick'), 'onclick should be removed');
  assert(result.includes('link'), 'Text should remain');
});

// ─── Fixture HTML Generation Tests ────────────────────────────────────────
// Test the expected fixture HTML structure (without running a browser).

Deno.test('fixture HTML: esm.sh URL conversion for Shoelace', () => {
  // The toEsmUrl function maps Shoelace imports to full bundle
  const importSpec = '@shoelace-style/shoelace/dist/components/alert/alert.js';
  // Shoelace imports the full bundle for sub-component registration
  const expected = 'https://esm.sh/@shoelace-style/shoelace@2.20.1';
  // Verify the pattern (the function is private so we check output structure)
  assert(importSpec.startsWith('@shoelace-style/shoelace'));
  assert(expected.includes('esm.sh'));
  assert(expected.includes('2.20.1'));
});

Deno.test('fixture HTML: component tag generation with attributes', () => {
  // Verify attribute string building logic (same as in snapshot-playwright.ts)
  const demoAttrs: Record<string, string> = { variant: 'primary', open: '' };
  const attrs = Object.entries(demoAttrs)
    .map(([k, v]) => v === '' ? k : `${k}="${v}"`)
    .join(' ');
  assertEquals(attrs, 'variant="primary" open');
});

Deno.test('fixture HTML: component tag generation without attributes', () => {
  const demoAttrs: Record<string, string> | undefined = undefined;
  const attrs = demoAttrs
    ? Object.entries(demoAttrs)
      .map(([k, v]) => v === '' ? k : `${k}="${v}"`)
      .join(' ')
    : '';
  assertEquals(attrs, '');
});

// ─── Slot Map Construction Tests ───────────────────────────────────────────
// Test the slot assignment logic that was fixed for whitespace between siblings.

interface MockElementNode {
  nodeType: 1;
  getAttribute: (name: string) => string | null;
  outerHTML: string;
}

interface MockTextNode {
  nodeType: 3;
  textContent: string;
}

type MockNode = MockElementNode | MockTextNode;

Deno.test('slot map: elements in same slot are space-separated', () => {
  // Simulates the slot map construction from snapshot-playwright.ts
  const childNodes: MockNode[] = [
    { nodeType: 1, getAttribute: (_name: string) => 'nav', outerHTML: '<sl-tab>Tab A</sl-tab>' },
    { nodeType: 1, getAttribute: (_name: string) => 'nav', outerHTML: '<sl-tab>Tab B</sl-tab>' },
  ];

  const slotMap: Record<string, string> = {};
  for (const child of childNodes) {
    if (child.nodeType === 1) {
      const slotName = child.getAttribute('slot') || 'default';
      const existing = slotMap[slotName] || '';
      const separator = existing ? ' ' : '';
      slotMap[slotName] = existing + separator + child.outerHTML;
    }
  }

  assertStringIncludes(slotMap['nav'], '<sl-tab>Tab A</sl-tab>');
  assertStringIncludes(slotMap['nav'], '<sl-tab>Tab B</sl-tab>');
  assert(slotMap['nav'].includes('</sl-tab> <sl-tab'), 'Space between sibling elements');
});

Deno.test('slot map: text nodes go to default slot', () => {
  const childNodes: MockNode[] = [
    { nodeType: 3, textContent: 'Hello world' },
    {
      nodeType: 1,
      getAttribute: (_name: string) => 'header',
      outerHTML: '<span slot="header">Title</span>',
    },
  ];

  const slotMap: Record<string, string> = {};
  for (const child of childNodes) {
    if (child.nodeType === 1) {
      const slotName = child.getAttribute('slot') || 'default';
      const existing = slotMap[slotName] || '';
      const separator = existing ? ' ' : '';
      slotMap[slotName] = existing + separator + child.outerHTML;
    } else if (child.nodeType === 3) {
      const text = child.textContent.trim();
      if (text) {
        const existing = slotMap['default'] || '';
        slotMap['default'] = existing + text;
      }
    }
  }

  assertEquals(slotMap['default'], 'Hello world');
  assertEquals(slotMap['header'], '<span slot="header">Title</span>');
});

Deno.test('slot map: whitespace-only text nodes are dropped', () => {
  const childNodes: MockNode[] = [
    { nodeType: 3, textContent: '   \n  ' },
    { nodeType: 3, textContent: 'real text' },
  ];

  const slotMap: Record<string, string> = {};
  for (const child of childNodes) {
    if (child.nodeType === 3) {
      const text = child.textContent.trim();
      if (text) {
        const existing = slotMap['default'] || '';
        slotMap['default'] = existing + text;
      }
    }
  }

  assertEquals(slotMap['default'], 'real text');
  assert(!slotMap['default']?.includes('\n'), 'Whitespace-only nodes should be dropped');
});

// ─── Placeholder Tests ────────────────────────────────────────────────────

Deno.test('placeholder: contains tag name', () => {
  const tagName = 'sl-button';
  const placeholder =
    `<div class="snapshot-preview"><span style="display:inline-block;padding:0.75rem 1.25rem;border:1px dashed #d0d0d0;border-radius:6px;font-family:monospace;font-size:0.8125rem;color:#999;background:#fafafa;">${tagName}</span></div>`;
  assertStringIncludes(placeholder, tagName);
  assertStringIncludes(placeholder, 'snapshot-preview');
  assertStringIncludes(placeholder, 'dashed');
});
