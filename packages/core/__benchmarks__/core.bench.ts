/**
 * LessJS Core Performance Benchmarks
 *
 * Run: deno bench --allow-read --no-check packages/core/__benchmarks__/core.bench.ts
 *
 * Measures framework primitives in isolation:
 * - renderDSD() throughput
 * - html template rendering
 * - Signal reactivity
 * - DsdElement lifecycle
 */

import { html, renderDSD, signal, unsafeHTML } from '../src/index.ts';

// ─── Helpers ────────────────────────────────────────────────

/** Minimal component returning a simple string */
class BenchCard {
  render() {
    return '<p>Hello</p>';
  }
}

/** Component returning html template */
class BenchReactive {
  count = signal(0);
  render() {
    return html`
      <span>${this.count}</span>
    `;
  }
}

// ─── renderDSD() — Core Rendering Pipeline ──────────────────

Deno.bench('renderDSD: simple component (string output)', async () => {
  await renderDSD(
    'bench-card',
    BenchCard as unknown as CustomElementConstructor,
    {},
  );
});

Deno.bench('renderDSD: reactive component (html template)', async () => {
  await renderDSD(
    'bench-reactive',
    BenchReactive as unknown as CustomElementConstructor,
    {},
  );
});

Deno.bench('renderDSD: with 5 attributes', async () => {
  await renderDSD(
    'bench-card',
    BenchCard as unknown as CustomElementConstructor,
    { title: 'Hello World', count: '42', active: '', disabled: '', label: 'test' },
  );
});

// ─── html Template — Authoring Primitive ────────────────────

Deno.bench('html: simple interpolation', () => {
  void html`
    <h1>${'LessJS'}</h1>
  `;
});

Deno.bench('html: 10 interpolations (list)', () => {
  const items = Array.from({ length: 10 }, (_, i) => `item-${i}`);
  void html`
    <ul>${items.map((x) =>
      html`
        <li>${x}</li>
      `
    )}</ul>
  `;
});

Deno.bench('html: with unsafeHTML', () => {
  void html`
    <div>${unsafeHTML('<strong>bold</strong>')}</div>
  `;
});

Deno.bench('html: 5 attribute bindings', () => {
  void html`
    <input
      type="text"
      placeholder="Enter name"
      .value="${'test'}"
      aria-label="${'Name field'}"
      data-id="${'input-1'}"
    />
  `;
});

// ─── Signal Reactivity ──────────────────────────────────────

Deno.bench('signal: create + read 1 value', () => {
  const s = signal(0);
  void s.value;
});

Deno.bench('signal: read 10,000 values', () => {
  const s = signal(42);
  for (let i = 0; i < 10_000; i++) {
    void s.value;
  }
});

Deno.bench('signal: write 10,000 values', () => {
  const s = signal(0);
  for (let i = 0; i < 10_000; i++) {
    s.value = i;
  }
});

Deno.bench('signal: subscribe + 100 writes (reactivity)', () => {
  const s = signal(0);
  let called = 0;
  const unsub = s.subscribe(() => {
    called++;
  });
  for (let i = 0; i < 100; i++) {
    s.value = i;
  }
  unsub();
  void called;
});

// ─── DsdElement Lifecycle ───────────────────────────────────
// NOTE: DsdElement.connectedCallback() requires browser DOM (attachShadow).
// Lifecycle benchmarks are run in E2E tests (Playwright) instead.

// ─── Bulk Rendering (SSG Simulation) ────────────────────────

Deno.bench('renderDSD: 20 components sequential (SSG sim)', async () => {
  const Ctor = BenchCard as unknown as CustomElementConstructor;
  for (let i = 0; i < 20; i++) {
    await renderDSD('bench-card', Ctor, { index: String(i) });
  }
});
