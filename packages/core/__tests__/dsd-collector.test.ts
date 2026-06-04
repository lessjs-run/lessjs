/**
 * @openelement/core - DsdRenderCollector unit tests (Deno)
 *
 * Tests for the DSD render metrics collector used for build-time reporting.
 * Purely tests the collector data structure.
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { DsdRenderCollector } from '../src/types.ts';

Deno.test('DsdRenderCollector - empty collector', () => {
  const collector = new DsdRenderCollector();
  const report = collector.getReport();
  assertEquals(report.totalComponents, 0);
  assertEquals(report.dsdComponents, 0);
  assertEquals(report.hydratedComponents, 0);
  assertEquals(report.pureIslands, 0);
  assertEquals(report.totalDsdSize, 0);
  assertEquals(report.maxNestingDepth, 0);
});

Deno.test('DsdRenderCollector - aggregates DSD component metrics', () => {
  const collector = new DsdRenderCollector();
  collector.add({
    tagName: 'less-button',
    renderTimeMs: 0.5,
    templateSize: 120,
    layer: 'dsd-static',
    hasError: false,
    nestingDepth: 1,
  });
  collector.add({
    tagName: 'home-page',
    renderTimeMs: 2.0,
    templateSize: 1024,
    layer: 'dsd-interactive',
    hasError: false,
    nestingDepth: 0,
  });
  const report = collector.getReport();
  assertEquals(report.totalComponents, 2);
  assertEquals(report.dsdComponents, 2);
  assertEquals(report.totalDsdSize, 120 + 1024);
  assertEquals(report.maxNestingDepth, 1);
  assertEquals(report.pureIslands, 0);
});

Deno.test('DsdRenderCollector - distinguishes pure islands', () => {
  const collector = new DsdRenderCollector();
  collector.add({
    tagName: 'home-page',
    renderTimeMs: 2.0,
    templateSize: 1024,
    layer: 'dsd-static',
    hasError: false,
    nestingDepth: 0,
  });
  collector.add({
    tagName: 'less-theme-toggle',
    renderTimeMs: 1.0,
    templateSize: 0,
    layer: 'pure-island',
    hasError: false,
    nestingDepth: 2,
  });
  const report = collector.getReport();
  assertEquals(report.totalComponents, 2);
  assertEquals(report.pureIslands, 1);
  assertEquals(report.dsdComponents, 1);
});

Deno.test('DsdRenderCollector - metrics are readonly snapshot', () => {
  const collector = new DsdRenderCollector();
  collector.add({
    tagName: 'less-button',
    renderTimeMs: 0.5,
    templateSize: 120,
    layer: 'dsd-static',
    hasError: false,
    nestingDepth: 1,
  });
  assertEquals(collector.metrics.length, 1);
  assertEquals(collector.metrics[0].tagName, 'less-button');
});
