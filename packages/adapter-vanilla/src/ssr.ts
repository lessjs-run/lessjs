/**
 * @openelement/adapter-vanilla - SSR Adapter
 *
 * Registers the 'vanilla' adapter for plain Web Components.
 * v0.30.0 removes string render compatibility from core; this adapter now
 * handles style extraction only.
 *
 * How it works:
 *   - extractStyles(): reads the static `styles` property (string or
 *     string array) from the component class.
 *
 * @module @openelement/adapter-vanilla/ssr
 */

import { getDefaultRegistry } from '@openelement/core';
import { createLogger } from '@openelement/core/logger';

const log = createLogger('adapter-vanilla');

/**
 * Extract static styles from a vanilla Web Component class.
 *
 * Vanilla components store styles on the static `styles` property:
 * - A single string: `static styles = ':host { display: block; }'`
 * - An array of strings: `static styles = ['base.css', 'theme.css']`
 */
export function extractVanillaStyles(
  componentClass: CustomElementConstructor,
): string | undefined {
  try {
    const ctor = componentClass as { styles?: unknown };
    const styles = ctor.styles;
    if (!styles) return undefined;

    // Normalize to string
    if (typeof styles === 'string') return styles;

    // Array of strings
    if (Array.isArray(styles)) {
      const parts = styles
        .filter((s): s is string => typeof s === 'string')
        .join('\n');
      return parts.length > 0 ? parts : undefined;
    }

    return undefined;
  } catch (err) {
    const name = (componentClass as { name?: string }).name || 'unknown';
    log.warn(
      `Failed to extract styles for <${name}>:`,
      err instanceof Error ? err.message : err,
    );
    return undefined;
  }
}

// Module-level idempotency guard.
let _installed = false;

/**
 * Install the vanilla SSR adapter into @openelement/core's renderDsd.
 *
 * The vanilla adapter provides style extraction from the static `styles`
 * property. Component output itself must use core's VNode/null contract.
 *
 * Idempotent - safe to call multiple times.
 */
export function installVanillaAdapter(): void {
  if (_installed) return;

  getDefaultRegistry().register({
    name: 'vanilla',
    isTemplate: (_value: unknown): boolean => false,
    extractStyles: (componentClass: CustomElementConstructor): string | undefined => {
      return extractVanillaStyles(componentClass);
    },
  });

  _installed = true;
  log.info('Vanilla SSR adapter installed - style extraction only');
}

/**
 * Uninstall the vanilla SSR adapter.
 *
 * Resets the adapter so core's renderDsd reverts to its default behavior.
 */
export function uninstallVanillaAdapter(): void {
  getDefaultRegistry().register(undefined);
  _installed = false;
}
