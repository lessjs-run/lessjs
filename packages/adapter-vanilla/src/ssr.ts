/**
 * @lessjs/adapter-vanilla - SSR Adapter
 *
 * Registers the 'vanilla' adapter for plain Web Components.
 * Vanilla components return strings from render() - the adapter
 * handles style extraction and provides the RendererProtocol interface.
 *
 * How it works:
 *   - isTemplate(): vanilla components always return strings, so we
 *     return false - core's renderDSD() handles string output directly.
 *   - render(): passthrough - called only if isTemplate returns true.
 *   - extractStyles(): reads the static `styles` property (string or
 *     string array) from the component class.
 *
 * @module @lessjs/adapter-vanilla/ssr
 */

import { registerAdapter } from '@lessjs/core';
import { createLogger } from '@lessjs/core/logger';

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
    const ctor = componentClass as unknown as Record<string, unknown>;
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
 * Install the vanilla SSR adapter into @lessjs/core's renderDSD.
 *
 * The vanilla adapter handles plain Web Components whose render()
 * returns a string directly. It provides style extraction from the
 * static `styles` property.
 *
 * Idempotent - safe to call multiple times.
 */
export function installVanillaAdapter(): void {
  if (_installed) return;

  registerAdapter({
    name: 'vanilla',
    // Vanilla components always return strings - no template detection needed.
    // core's renderDSD handles string output directly.
    isTemplate: (_value: unknown): boolean => false,
    render: (value: unknown, _tagName: string): Promise<string> => {
      return Promise.resolve(String(value));
    },
    extractStyles: (componentClass: CustomElementConstructor): string | undefined => {
      return extractVanillaStyles(componentClass);
    },
  });

  _installed = true;
  log.info('Vanilla SSR adapter installed - string render with style extraction');
}

/**
 * Uninstall the vanilla SSR adapter.
 *
 * Resets the adapter so core's renderDSD reverts to its default behavior.
 */
export function uninstallVanillaAdapter(): void {
  registerAdapter(undefined);
  _installed = false;
}
