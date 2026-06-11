/**
 * Lightweight conformance helpers for protocol implementers.
 *
 * These helpers intentionally check protocol behavior, not implementation
 * internals. Package-specific suites can call them against current or future
 * adapters.
 */

import type { CacheAdapter, CacheEntry } from './cache.ts';
import type { ComponentAdapter } from './components.ts';
import type { DataAdapter } from './data.ts';
import type { RendererConformanceFixture, RendererProtocol } from './renderer.ts';
import type { RuntimeAdapter } from './runtime.ts';

export interface ConformanceResult {
  name: string;
  passed: boolean;
  message?: string;
}

function pass(name: string): ConformanceResult {
  return { name, passed: true };
}

function fail(name: string, message: string): ConformanceResult {
  return { name, passed: false, message };
}

export async function runRendererConformance(
  renderer: RendererProtocol,
  fixture: RendererConformanceFixture,
): Promise<ConformanceResult[]> {
  const results: ConformanceResult[] = [];
  results.push(renderer.name ? pass('renderer.name') : fail('renderer.name', 'name is required'));

  if (renderer.isTemplate) {
    results.push(
      renderer.isTemplate(fixture.template)
        ? pass('renderer.isTemplate')
        : fail('renderer.isTemplate', 'fixture template was rejected'),
    );
  }

  if (renderer.render) {
    const html = await renderer.render(fixture.template, fixture.tagName);
    results.push(
      typeof html === 'string'
        ? pass('renderer.render.string')
        : fail('renderer.render.string', 'render() must resolve to a string'),
    );
    if (fixture.expectedHtml !== undefined) {
      results.push(
        html === fixture.expectedHtml
          ? pass('renderer.render.expectedHtml')
          : fail('renderer.render.expectedHtml', 'rendered HTML did not match fixture'),
      );
    }
  }

  return results;
}

export function runComponentAdapterConformance(
  adapter: ComponentAdapter,
  component: unknown,
  tagName: string,
): ConformanceResult[] {
  const results: ConformanceResult[] = [];
  results.push(adapter.name ? pass('component.name') : fail('component.name', 'name is required'));
  results.push(
    adapter.isComponent(component)
      ? pass('component.isComponent')
      : fail('component.isComponent', 'fixture component was rejected'),
  );
  if (adapter.isComponent(component)) {
    const descriptor = adapter.describe(component, tagName);
    results.push(
      descriptor.tagName === tagName
        ? pass('component.describe.tagName')
        : fail('component.describe.tagName', 'descriptor tagName must match fixture tagName'),
    );
  }
  return results;
}

export async function runRuntimeAdapterConformance(
  adapter: RuntimeAdapter,
  request: Request,
): Promise<ConformanceResult[]> {
  const results: ConformanceResult[] = [];
  results.push(adapter.name ? pass('runtime.name') : fail('runtime.name', 'name is required'));
  const response = await adapter.fetch(request);
  results.push(
    response instanceof Response
      ? pass('runtime.fetch.response')
      : fail('runtime.fetch.response', 'fetch() must return a Response'),
  );
  return results;
}

export async function runCacheAdapterConformance<T>(
  adapter: CacheAdapter<T>,
  key: string,
  entry: CacheEntry<T>,
): Promise<ConformanceResult[]> {
  const results: ConformanceResult[] = [];
  results.push(adapter.name ? pass('cache.name') : fail('cache.name', 'name is required'));
  await adapter.set(key, entry);
  const stored = await adapter.get(key);
  results.push(
    stored?.createdAt === entry.createdAt && stored.value === entry.value
      ? pass('cache.get.set')
      : fail('cache.get.set', 'get() must return the entry stored by set()'),
  );
  if (adapter.delete) {
    const deleted = await adapter.delete(key);
    const afterDelete = await adapter.get(key);
    results.push(
      deleted && afterDelete === undefined
        ? pass('cache.delete')
        : fail('cache.delete', 'delete() must remove the fixture key'),
    );
  }
  return results;
}

export async function runDataAdapterConformance<T>(
  adapter: DataAdapter<T>,
  existingKey: string,
  expectedValue: T,
): Promise<ConformanceResult[]> {
  const results: ConformanceResult[] = [];
  results.push(adapter.name ? pass('data.name') : fail('data.name', 'name is required'));
  const value = await adapter.get(existingKey);
  results.push(
    value === expectedValue
      ? pass('data.get')
      : fail('data.get', 'get() must return the expected fixture value'),
  );
  if (adapter.keys) {
    const keys = await adapter.keys();
    results.push(
      keys.includes(existingKey)
        ? pass('data.keys')
        : fail('data.keys', 'keys() must include the fixture key'),
    );
  }
  return results;
}
