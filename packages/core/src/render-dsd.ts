/**
 * @lessjs/core - DSD Renderer.
 *
 * Pure string-based Declarative Shadow DOM SSR renderer.
 * Framework-agnostic: no Lit dependency and no TemplateResult knowledge.
 *
 * LessJS Architecture (v0.15.0):
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
import { type DsdOptions, type DsdRenderCollector } from './types.js';
import { getAdapter } from './adapter-registry.js';
import { renderNestedCustomElements } from './render-nested.js';
import { createLogger } from './logger.js';

// ─── Extracted modules ─────────────────────────────────────────
import { injectProps, instantiateComponent } from './render-instantiate.js';
import { instantiationErrorHtml, renderErrorHtml, wrongTypeErrorHtml } from './render-errors.js';
import { serializeAttributes, wrapDsdOutput } from './render-serialize.js';

const log = createLogger('core');

// ─── DSD Rendering ──────────────────────────────────────────────

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
  nestingDepth = 0,
): Promise<string> {
  // H-10 fix: Guard against SSR environments where performance is undefined
  const startTime = typeof performance !== 'undefined' ? performance.now() : 0;
  const adapter = getAdapter();
  const sourceStr = sourceInfo
    ? `${sourceInfo.route ? ` route="${sourceInfo.route}"` : ''}${
      sourceInfo.source ? ` source="${sourceInfo.source}"` : ''
    }`
    : '';

  // 1. Instantiate the component
  const instance = instantiateComponent(tagName, componentClass);
  if (!instance) {
    const errMsg = 'Failed to instantiate';
    return instantiationErrorHtml(
      tagName,
      errMsg,
      sourceStr,
      sourceInfo?.route,
      sourceInfo?.source,
    );
  }

  // 2. Set attributes/properties
  injectProps(instance, tagName, props);

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
      if (
        adapter?.isTemplate &&
        adapter?.render &&
        adapter.isTemplate(result)
      ) {
        content = await adapter.render(result, tagName);
      } else {
        const errDetail = isLitTemplateResultHeuristic(result)
          ? 'This looks like a Lit TemplateResult — install @lessjs/adapter-lit to handle it.'
          : `Components must return a string from render(), got ${typeof result}.`;
        content = wrongTypeErrorHtml(tagName, typeof result, errDetail);
      }
    }
  } catch (err) {
    content = renderErrorHtml(tagName, err);
  }

  // v0.6: L2 Nested DSD — recursively render nested Custom Elements
  content = await renderNestedCustomElements(content, collector);

  // 5. Extract static styles from component class
  let styleCss = '';
  if (adapter?.extractStyles) {
    try {
      styleCss = adapter.extractStyles(componentClass) || '';
    } catch (e) {
      log.debug(
        `extractStyles failed for <${tagName}>: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  // 6. Resolve component layer
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
      nestingDepth,
    });
  }

  // 7. Wrap in DSD output
  return wrapDsdOutput({
    tagName,
    props,
    content,
    styleCss,
    layer: resolvedLayer,
    sourceStr,
    dsdOptions,
  });
}

/**
 * Heuristic check for Lit TemplateResult without importing Lit.
 * Checks for the _$litType$ marker that Lit uses internally.
 * This is only used for error messaging — actual rendering goes through adapters.
 */
function isLitTemplateResultHeuristic(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_$litType$' in (value as Record<string, unknown>)
  );
}

/**
 * Render a component from the global Custom Element registry.
 * Looks up the class by tag name using customElements.get().
 *
 * @param tagName - Registered custom element tag name
 * @param props - Attribute/property key-value pairs
 * @param sourceInfo - Optional context for error messages (route path, source file)
 * @returns DSD HTML string, or error HTML if tag is not registered
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

  return await renderDSD(
    tagName,
    cls as CustomElementConstructor,
    props,
    sourceInfo,
    dsdOptions,
  );
}
