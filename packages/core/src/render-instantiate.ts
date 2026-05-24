/**
 * @lessjs/core - Render Instantiation.
 *
 * Component instantiation and property injection for the render pipeline.
 * Extracted from render-dsd.ts for maintainability.
 *
 * @module @lessjs/core/render-instantiate
 */

import type { DsdComponent } from './types.js';
import { DANGEROUS_KEYS } from './security.js';
import { createLogger } from './logger.js';

const log = createLogger('core');

/**
 * Instantiate a Custom Element class for SSR rendering.
 *
 * @returns The component instance, or null if instantiation failed
 */
export function instantiateComponent(
  tagName: string,
  componentClass: CustomElementConstructor,
): DsdComponent | null {
  try {
    return new componentClass() as unknown as DsdComponent;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log.error(`Failed to instantiate <${tagName}>:`, errMsg);
    return null;
  }
}

/**
 * Inject properties onto a component instance.
 *
 * Skips dangerous keys (prototype pollution guard) and read-only properties.
 */
export function injectProps(
  instance: DsdComponent,
  tagName: string,
  props: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(props)) {
    // v0.14.7: Prevent prototype pollution - skip dangerous keys (C-04 fix).
    if (DANGEROUS_KEYS.has(key)) {
      log.warn(
        `Skipping dangerous prop key "${key}" on <${tagName}> - potential prototype pollution`,
      );
      continue;
    }
    try {
      (instance as Record<string, unknown>)[key] = value;
    } catch (e) {
      // Some properties may be read-only - safe to skip, but log for debuggability
      log.debug(
        `Cannot set read-only property "${key}" on <${tagName}>: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }
}
