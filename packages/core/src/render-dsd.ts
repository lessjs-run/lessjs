/**
 * @lessjs/core - DSD Renderer.
 *
 * Pure string-based Declarative Shadow DOM SSR renderer.
 * Framework-agnostic: no Lit dependency and no TemplateResult knowledge.
 *
 * LessJS Architecture (v0.6.0):
 * - Takes a registered Custom Element class + props and returns DSD HTML
 * - Components MUST implement render(): string
 * - Rendering is synchronous string concatenation; no DOM shim needed
 * - Framework adapters hook into the pipeline via registerAdapter()
 * - Safe/Unsafe HTML contracts preserve Lit's escaping semantics
 *
 * SSR lifecycle:
 *   1. Instantiate component class
 *   2. Set attributes/properties from props
 *   3. Call render() to get Shadow DOM HTML string
 *   4. Wrap in <template shadowrootmode="open">
 *
 * Client lifecycle:
 *   1. Browser parses DSD and attaches Shadow DOM automatically
 *   2. customElements.define() upgrades existing elements
 *   3. connectedCallback fires and attaches event listeners to existing DOM
 *   4. No duplicate client render is needed
 *
 * @module @lessjs/core/render-dsd
 */

// ─── Internal imports ──────────────────────────────────────────
import { escapeAttr, escapeAttrValue, escapeHtml } from './html-escape.js';
import { type DsdComponent, type DsdOptions, type DsdRenderCollector } from './types.js';
import { getAdapter } from './adapter-registry.js';
import { renderNestedCustomElements } from './render-nested.js';
import { createLogger } from './logger.js';

const log = createLogger('core');

// ─── DSD Rendering ──────────────────────────────────────────────

/**
 * Convert camelCase to kebab-case for HTML attribute names.
 * e.g. currentPath → current-path, navItems → nav-items
 *
 * HTML attributes are case-insensitive — browsers lowercase them.
 * Lit's @property({attribute: 'current-path'}) expects kebab-case.
 * Without this conversion, currentPath would render as "currentpath"
 * (lowercased by the browser) and never match "current-path".
 */
export function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/** Serialize key-value strings to HTML attribute string */
function serializeAttributes(props: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(props)) {
    if (val === false || val === null || val === undefined) continue;
    // Convert camelCase to kebab-case so Lit's attribute observer
    // can read the value back on client-side upgrade.
    // e.g. currentPath → current-path
    const attrKey = camelToKebab(key);
    if (val === true) {
      parts.push(attrKey);
    } else if (typeof val === 'object') {
      // Array or Object: JSON-encode and escape for safe HTML attribute embedding.
      // Client-side Lit deserializes via property setter (not attribute), so the
      // JSON string only needs to survive HTML parsing, not be human-readable.
      parts.push(`${attrKey}="${escapeAttrValue(JSON.stringify(val))}"`);
    } else {
      parts.push(`${attrKey}="${escapeAttrValue(val)}"`);
    }
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

/**
 * Render a single component to DSD HTML string.
 *
 * v0.6': DSD spec alignment — shadowrootdelegatesfocus, shadowrootserializable,
 * shadowrootslotassignment, shadowrootcustomelementregistry per WHATWG spec.
 *
 * @param tagName - Custom element tag name (e.g. 'less-button')
 * @param componentClass - Registered Custom Element class constructor
 * @param props - Attribute/property key-value pairs
 * @param sourceInfo - Optional context for error messages (route path, source file)
 * @param dsdOptions - Optional DSD template attributes per HTML Living Standard
 * @returns Complete DSD HTML string
 *
 * @example
 * ```ts
 * const html = renderDSD('less-button', LessButton, { variant: 'primary' }, undefined, { delegatesFocus: true })
 * // → <less-button variant="primary">
 * //      <template shadowrootmode="open" shadowrootdelegatesfocus>
 * //        <style>:host{...}</style>
 * //        <button>Click</button>
 * //      </template>
 * //    </less-button>
 * ```
 */
export async function renderDSD(
  tagName: string,
  componentClass: CustomElementConstructor,
  props: Record<string, unknown> = {},
  sourceInfo?: { route?: string; source?: string },
  dsdOptions?: DsdOptions,
  collector?: DsdRenderCollector,
): Promise<string> {
  const startTime = performance.now();
  const sourceStr = sourceInfo
    ? `${sourceInfo.route ? ` route="${sourceInfo.route}"` : ''}${
      sourceInfo.source ? ` source="${sourceInfo.source}"` : ''
    }`
    : '';

  // 1. Instantiate the component
  let instance: DsdComponent;
  try {
    instance = new componentClass() as unknown as DsdComponent;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log.error(`Failed to instantiate <${tagName}>:`, errMsg);
    return (
      `<${tagName}${sourceStr}><!-- LessJS ERROR: Failed to instantiate <${tagName}>: ${
        escapeHtml(errMsg)
      } -->` +
      (sourceInfo?.route ? `\n<!-- Route: ${escapeHtml(sourceInfo.route)} -->` : '') +
      (sourceInfo?.source ? `\n<!-- Source: ${escapeHtml(sourceInfo.source)} -->` : '') +
      `</${tagName}>`
    );
  }

  // 2. Set attributes/properties
  for (const [key, value] of Object.entries(props)) {
    try {
      (instance as Record<string, unknown>)[key] = value;
    } catch (e) {
      // Some properties may be read-only — safe to skip, but log for debuggability
      log.debug(
        `Cannot set read-only property "${key}" on <${tagName}>: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  // 3. DO NOT call connectedCallback in SSR.
  // 4. Call render() to get Shadow DOM content
  let content: string;
  try {
    const result = instance.render();
    if (result == null) {
      content = '';
    } else if (typeof result === 'string') {
      content = result;
    } else {
      const adapter = getAdapter();

      if (adapter?.isTemplate && adapter?.render && adapter.isTemplate(result)) {
        content = await adapter.render(result, tagName);
      } else {
        const errDetail = isLitTemplateResultHeuristic(result)
          ? 'This looks like a Lit TemplateResult — install @lessjs/adapter-lit to handle it.'
          : `Components must return a string from render(), got ${typeof result}.`;
        log.error(
          `<${tagName}> render() returned ${typeof result} instead of string. ${errDetail}`,
        );
        content =
          `<!-- LessJS ERROR: <${tagName}> render() returned ${typeof result}, expected string. ${errDetail} -->`;
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : '';
    log.error(
      `<${tagName}> render() failed: ${errMsg}${errStack ? `\n${errStack}` : ''}`,
    );
    content = `<!-- LessJS ERROR: <${tagName}> render() threw: ${escapeHtml(errMsg)} -->\n` +
      (errStack
        ? `<!-- Stack: ${escapeHtml(errStack.split('\n').slice(0, 3).join(' | '))} -->\n`
        : '') +
      '<!-- Check console for full error details -->';
  }

  // v0.6: L2 Nested DSD — recursively render nested Custom Elements
  // v0.12.0: Pass collector through for build-time DSD reporting
  content = await renderNestedCustomElements(content, collector);

  // 5. Extract static styles from component class
  let styleCss = '';
  const adapter = getAdapter();
  if (adapter?.extractStyles) {
    try {
      styleCss = adapter.extractStyles(componentClass) || '';
    } catch (e) {
      // Style extraction failed — continue without styles, but log for debuggability
      log.debug(
        `extractStyles failed for <${tagName}>: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  // 6. Wrap in DSD (or skip for Pure Island layer)
  // v0.6.2: Layer 3 (pure-island) components skip DSD entirely.
  // The framework fully owns the shadow root — no pre-rendered template.
  const resolvedLayer = dsdOptions?.layer || instance.layer || 'dsd-static';

  // ─── Collect DSD render metrics (if collector provided) ─────
  const renderEnd = performance.now();
  if (collector) {
    collector.add({
      tagName,
      renderTimeMs: renderEnd - startTime,
      templateSize: content.length,
      layer: resolvedLayer,
      hasError: false,
      nestingDepth: 0,
    });
  }

  if (resolvedLayer === 'pure-island') {
    // Pure Island: no DSD template, framework will create shadow root on client
    const attrs = serializeAttributes(props);
    const ssrPropsAttr = Object.keys(props).length > 0
      ? ` data-ssr-props="${escapeAttrValue(JSON.stringify(props))}"`
      : '';
    return `<${tagName}${attrs}${ssrPropsAttr}${sourceStr}></${tagName}>`;
  }

  // Layer 1 (dsd-static) and Layer 2 (dsd-interactive): emit DSD template
  const attrs = serializeAttributes(props);
  const ssrPropsAttr = Object.keys(props).length > 0
    ? ` data-ssr-props="${escapeAttrValue(JSON.stringify(props))}"`
    : '';
  const styleTag = styleCss ? `\n    <style>${styleCss}</style>` : '';

  // Build DSD template attributes per HTML Living Standard
  const dsdAttrs = buildDsdTemplateAttrs(dsdOptions);

  return `<${tagName}${attrs}${ssrPropsAttr}${sourceStr}>
  <template shadowrootmode="open"${dsdAttrs}>${styleTag}
    ${content}
  </template>
</${tagName}>`;
}

/**
 * Build DSD template attributes per WHATWG HTML Living Standard.
 * Only includes non-default attributes to keep output clean.
 */
function buildDsdTemplateAttrs(options?: DsdOptions): string {
  if (!options) return '';
  const parts: string[] = [];
  if (options.delegatesFocus) parts.push(' shadowrootdelegatesfocus');
  if (options.serializable) parts.push(' shadowrootserializable');
  if (options.slotAssignment === 'manual') parts.push(' shadowrootslotassignment="manual"');
  if (options.customElementRegistry) {
    parts.push(` shadowrootcustomelementregistry="${escapeAttr(options.customElementRegistry)}"`);
  }
  return parts.join('');
}

/**
 * Heuristic check for Lit TemplateResult without importing Lit.
 * Checks for the _$litType$ marker that Lit uses internally.
 * This is only used for error messaging — actual rendering goes through adapters.
 */
function isLitTemplateResultHeuristic(value: unknown): boolean {
  return typeof value === 'object' && value !== null &&
    '_$litType$' in (value as Record<string, unknown>);
}

/**
 * Render a component from the global Custom Element registry.
 * Looks up the class by tag name using customElements.get().
 *
 * @param tagName - Registered custom element tag name
 * @param props - Attribute/property key-value pairs
 * @param sourceInfo - Optional context for error messages (route path, source file)
 * @returns DSD HTML string, or error HTML if tag is not registered
 *
 * @example
 * ```ts
 * const html = renderDSDByName('less-button', { variant: 'primary' })
 * ```
 */
export async function renderDSDByName(
  tagName: string,
  props: Record<string, unknown> = {},
  sourceInfo?: { route?: string; source?: string },
  dsdOptions?: DsdOptions,
): Promise<string> {
  const cls = globalThis.customElements?.get(tagName);

  if (!cls) {
    log.warn(`<${tagName}> is not registered — rendering as void element`);
    const attrs = serializeAttributes(props);
    return `<${tagName}${attrs}></${tagName}>`;
  }

  return await renderDSD(tagName, cls as CustomElementConstructor, props, sourceInfo, dsdOptions);
}
