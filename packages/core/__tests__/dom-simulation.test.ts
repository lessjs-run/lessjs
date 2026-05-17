/**
 * Tests for @lessjs/core DOM Simulation (v0.18.3 experimental).
 *
 * Tests cover:
 * - buildDomSimulationReport produces correct report structure
 * - Default config is 'off'
 * - Report records successes and failures
 * - Timeout handling in report
 */

import { assert, assertEquals } from 'jsr:@std/assert@1';

import { buildDomSimulationReport } from '../src/dom-simulation.ts';
import type { DomSimulationResult } from '../src/dom-simulation.ts';
import type { DomSimulationReport } from '../src/types.ts';

// ─── Helpers ─────────────────────────────────────────────────────────

function makeResult(
  overrides: Partial<DomSimulationResult> & { tagName: string },
): DomSimulationResult {
  return {
    success: false,
    renderTimeMs: 0,
    timedOut: false,
    fallback: 'client-only',
    ...overrides,
  };
}

// ─── Report Building ─────────────────────────────────────────────────

Deno.test('buildDomSimulationReport - empty results returns undefined', () => {
  const report = buildDomSimulationReport([]);
  assertEquals(report, undefined);
});

Deno.test('buildDomSimulationReport - undefined results returns undefined', () => {
  const report = buildDomSimulationReport(undefined as unknown as DomSimulationResult[]);
  assertEquals(report, undefined);
});

Deno.test('buildDomSimulationReport - reports correct structure', () => {
  const results = [
    makeResult({ tagName: 'my-button', success: true, renderTimeMs: 42, byteSize: 128 }),
  ];
  const report = buildDomSimulationReport(results) as DomSimulationReport;

  assertEquals(report.enabled, true);
  assertEquals(report.strategy, 'experimental-dom');
  assertEquals(report.attemptedCount, 1);
  assertEquals(report.succeededCount, 1);
  assertEquals(report.failedCount, 0);
  assertEquals(report.timeoutCount, 0);
  assertEquals(report.attempts.length, 1);
  assertEquals(report.attempts[0].tagName, 'my-button');
  assertEquals(report.attempts[0].success, true);
});

Deno.test('buildDomSimulationReport - counts failures correctly', () => {
  const results = [
    makeResult({ tagName: 'good-el', success: true, renderTimeMs: 10 }),
    makeResult({ tagName: 'bad-el', success: false, renderTimeMs: 5, error: 'render failed' }),
    makeResult({
      tagName: 'timeout-el',
      success: false,
      renderTimeMs: 500,
      timedOut: true,
      error: 'timed out',
    }),
  ];
  const report = buildDomSimulationReport(results) as DomSimulationReport;

  assertEquals(report.attemptedCount, 3);
  assertEquals(report.succeededCount, 1);
  assertEquals(report.failedCount, 2);
  assertEquals(report.timeoutCount, 1);
});

Deno.test('buildDomSimulationReport - timeout is not double-counted in failedCount', () => {
  const results = [
    makeResult({ tagName: 'timeout-el', success: false, renderTimeMs: 500, timedOut: true }),
    makeResult({ tagName: 'crash-el', success: false, renderTimeMs: 10, error: 'crash' }),
  ];
  const report = buildDomSimulationReport(results) as DomSimulationReport;

  assertEquals(report.failedCount, 2);
  assertEquals(report.timeoutCount, 1);
});

Deno.test('buildDomSimulationReport - fallback is recorded', () => {
  const results = [
    makeResult({ tagName: 'ok-el', success: true, fallback: 'none' }),
    makeResult({ tagName: 'fail-el', success: false, fallback: 'client-only' }),
  ];
  const report = buildDomSimulationReport(results) as DomSimulationReport;

  assertEquals(report.attempts[0].fallback, 'none');
  assertEquals(report.attempts[1].fallback, 'client-only');
});

// ─── renderWithDomSimulation (happy-dom integration) ──────────────
// These tests use a simple component definition that doesn't trigger
// happy-dom internal timers.

Deno.test('renderWithDomSimulation - returns result object with correct shape', {
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  const { renderWithDomSimulation } = await import('../src/dom-simulation.ts');

  const result = await renderWithDomSimulation({
    tagName: 'ds-simple-el',
    timeoutMs: 500,
    sourceCode: `
      customElements.define('ds-simple-el', class extends HTMLElement {
        connectedCallback() {
          if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
          this.shadowRoot.innerHTML = '<div>dom sim</div>';
        }
      });
    `,
  });

  assertEquals(result.tagName, 'ds-simple-el');
  assert(typeof result.renderTimeMs === 'number');
  assert(typeof result.timedOut === 'boolean');
  assert(['client-only', 'none'].includes(result.fallback));
});

Deno.test('renderWithDomSimulation - undefined element fails gracefully', {
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  const { renderWithDomSimulation } = await import('../src/dom-simulation.ts');

  const result = await renderWithDomSimulation({
    tagName: 'never-defined-el',
    timeoutMs: 100,
  });

  assertEquals(result.success, false);
  assert(result.error ? result.error.length > 0 : false, 'Should have an error message');
  assertEquals(result.fallback, 'client-only');
});
