/**
 * @lessjs/adapter-react - SSR Adapter
 *
 * Converts React elements to HTML strings via ReactDOMServer.
 * Produces clean DSD HTML without React hydration markers.
 *
 * How it works:
 *   - isTemplate(): detects React elements via $$typeof property
 *   - render(): uses ReactDOMServer.renderToStaticMarkup() for clean output
 *   - extractStyles(): React components use CSS-in-JS or import, no static
 *     style extraction (returns undefined)
 *
 * Why renderToStaticMarkup() instead of renderToString()?
 *   renderToString() adds data-reactroot attributes for client hydration.
 *   Since LessJS uses DSD (Declarative Shadow DOM) for SSR, we don't need
 *   React's hydration markers - the browser handles DOM from the template.
 *   renderToStaticMarkup() produces clean HTML without extra attributes.
 *
 * @module @lessjs/adapter-react/ssr
 */

import { registerAdapter } from '@lessjs/core';
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('adapter-react');

// ─── React Element Detection ─────────────────────────────────

/** Symbol used by React to identify elements (React 17+). */
const REACT_ELEMENT_TYPE = Symbol.for('react.element');
/** Symbol used by React 19 for transitional elements. */
const REACT_TRANSITIONAL_ELEMENT_TYPE = Symbol.for('react.transitional.element');

/**
 * Check if a value is a React element.
 *
 * React elements have a $$typeof property equal to Symbol.for('react.element')
 * (React ≤18) or Symbol.for('react.transitional.element') (React 19).
 */
export function isReactElement(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const typeSymbol = (value as Record<string, unknown>).$$typeof;
  return typeSymbol === REACT_ELEMENT_TYPE || typeSymbol === REACT_TRANSITIONAL_ELEMENT_TYPE;
}

// ─── React SSR Rendering ─────────────────────────────────────

/** Cached reference to renderToStaticMarkup once loaded */
let _renderToStaticMarkup: ((element: unknown) => string) | undefined;

/**
 * Lazy-load ReactDOMServer.renderToStaticMarkup.
 * Only available in Node.js/Deno SSR build contexts.
 */
async function loadRenderToStaticMarkup(): Promise<
  ((element: unknown) => string) | undefined
> {
  if (_renderToStaticMarkup) return _renderToStaticMarkup;
  try {
    const ReactDOMServer = await import('react-dom/server');
    if (typeof ReactDOMServer.renderToStaticMarkup === 'function') {
      _renderToStaticMarkup = ReactDOMServer.renderToStaticMarkup as (
        element: unknown,
      ) => string;
      return _renderToStaticMarkup;
    }
  } catch {
    log.warn('react-dom/server not available - React SSR disabled');
  }
  return undefined;
}

/**
 * Render a React element to HTML string.
 *
 * Uses ReactDOMServer.renderToStaticMarkup() for clean output
 * without React hydration markers. Must be called asynchronously
 * because react-dom/server is loaded via dynamic import.
 *
 * @param element - The React element to render
 * @param tagName - Component tag name (for error messages)
 * @returns HTML string
 */
export async function renderReactToString(
  element: unknown,
  tagName?: string,
): Promise<string> {
  if (!isReactElement(element)) {
    return String(element);
  }

  const renderFn = await loadRenderToStaticMarkup();
  if (!renderFn) {
    const tag = tagName || 'unknown';
    log.warn(
      `ReactDOMServer.renderToStaticMarkup not available for <${tag}>. ` +
        'Returning empty string.',
    );
    return '';
  }

  try {
    return renderFn(element);
  } catch (err) {
    const tag = tagName || 'unknown';
    throw new Error(
      `[LessJS] <${tag}> React SSR rendering failed. ` +
        `Original error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ─── Adapter Installation ────────────────────────────────────

let _installed = false;

/**
 * Install the React SSR adapter into @lessjs/core's renderDsd.
 *
 * This patches the DSD renderer so that when a component's render()
 * returns a React element, it's automatically converted to an HTML
 * string via ReactDOMServer.renderToStaticMarkup().
 *
 * Call this once at the top of your SSG build script or vite.config.ts:
 *
 *   import { installReactAdapter } from '@lessjs/adapter-react';
 *   installReactAdapter();
 *
 * Idempotent - safe to call multiple times.
 */
export function installReactAdapter(): void {
  if (_installed) return;

  registerAdapter({
    name: 'react',
    isTemplate: (value: unknown): boolean => {
      return isReactElement(value);
    },
    render: (value: unknown, tagName: string): Promise<string> => {
      return renderReactToString(value, tagName);
    },
    // React components don't use static styles property.
    // CSS-in-JS or imported CSS is handled differently.
    extractStyles: (_componentClass: CustomElementConstructor): string | undefined => {
      return undefined;
    },
  });

  _installed = true;
  log.info('React SSR adapter installed - React element to string');
}

/**
 * Uninstall the React SSR adapter.
 *
 * Resets the adapter so core's renderDsd reverts to its default behavior.
 */
export function uninstallReactAdapter(): void {
  registerAdapter(undefined);
  _installed = false;
}
