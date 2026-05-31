/**
 * @lessjs/core - DSD Renderer.
 *
 * Pure string-based Declarative Shadow DOM SSR renderer.
 * Framework-agnostic: no Lit dependency and no TemplateResult knowledge.
 *
 * LessJS Architecture (v0.28.0, ADR-0071):
 * - Takes a registered Custom Element class + props and returns DSD HTML
 * - Components implement render() returning string | VNode
 * - Nested CE rendering is handled inline by renderDsdTree() during
 *   the single-pass VNode traversal — no separate post-processing needed
 * - Framework adapters hook into the pipeline via registerAdapter()
 *
 * SSR lifecycle:
 *   1. Instantiate component class
 *   2. Set attributes/properties from props
 *   3. DO NOT call connectedCallback in SSR
 *   4. Call render() → get Shadow DOM content
 *   5. renderDsdTree() recursively processes nested CEs inline
 *   6. Wrap in <template shadowrootmode="open">
 *
 * Client lifecycle:
 *   1. Browser parses DSD and attaches Shadow DOM automatically
 *   2. customElements.define() upgrades existing elements
 *   3. connectedCallback fires and attaches event listeners to existing DOM
 *   4. No duplicate client render is needed
 *
 * @module @lessjs/core/render-dsd
 */

// --- Internal imports ------------------------------------------
import {
  type ComponentLayer,
  type DsdOptions,
  type DsdRenderCollector,
  type DsdRenderMetrics,
  type HydrationHint,
  type RenderError,
  type RenderHooks,
  type RenderInput,
  type RenderOutput,
} from './types.js';
import { getRegisteredAdapters } from './adapter-registry.js';
import type { StyleSheetLike } from '@lessjs/style-sheet';
import { createLogger } from './logger.js';

// --- Extracted modules -----------------------------------------
import { injectProps, instantiateComponent } from './render-instantiate.js';
import { instantiationErrorHtml, wrongTypeErrorHtml } from './render-errors.js';
import { classifyError } from './render-errors.js';
import { serializeAttributes, wrapDsdOutput } from './render-serialize.js';
import { isVNode } from './vnode.js';
import { renderDsdTree } from './jsx-render-string.js';

const log = createLogger('core');
const _textEncoder = new TextEncoder();

// --- DSD Rendering ----------------------------------------------

/**
 * Render a single component to DSD HTML as structured RenderOutput.
 *
 * v0.15.2: Returns `Promise<RenderOutput>` instead of `Promise<string>`.
 * Callers should destructure: `const { html, errors, metrics, hydrationHints } = await renderDsd(...)`
 *
 * v0.15.2: Accepts optional `RenderHooks` for pipeline observation.
 * Hooks are optional and do not change behavior when omitted.
 *
 * @param tagName - Custom element tag name (e.g. 'less-button')
 * @param componentClass - Registered Custom Element class constructor
 * @param props - Attribute/property key-value pairs
 * @param sourceInfo - Optional context for error messages (route path, source file)
 * @param dsdOptions - Optional DSD template attributes per HTML Living Standard
 * @param collector - Optional DSD render metrics collector
 * @param nestingDepth - Current nesting depth (0 = top-level)
 * @param hooks - Optional render pipeline hooks (beforeRender, afterRender, onError)
 * @returns Structured render output (html + errors + metrics + hydrationHints)
 */
export async function renderDsd(
  input: string | CustomElementConstructor,
  propsOrClass?: CustomElementConstructor | Record<string, unknown>,
  maybeProps?: Record<string, unknown>,
  sourceInfo?: { route?: string; source?: string },
  dsdOptions?: DsdOptions,
  collector?: DsdRenderCollector,
  nestingDepth?: number,
  hooks?: RenderHooks,
): Promise<RenderOutput> {
  // ADR-0072: Polymorphic input — string auto-lookup, class direct use.
  let tagName: string;
  let componentClass: CustomElementConstructor;
  let props: Record<string, unknown> = {};

  if (typeof input === 'string') {
    tagName = input;
    // Detect call signature:
    //   renderDsd('tag', props)           → propsOrClass is Record<>
    //   renderDsd('tag', Class, props)    → propsOrClass is class (backward compat)
    if (propsOrClass && typeof propsOrClass === 'function' && 'prototype' in propsOrClass) {
      componentClass = propsOrClass as CustomElementConstructor;
      props = (maybeProps as Record<string, unknown>) ?? {};
    } else {
      const cls = globalThis.customElements?.get(tagName) as CustomElementConstructor | undefined;
      if (!cls) {
        log.warn(`<${tagName}> is not registered - rendering as void element`);
        const attrs = serializeAttributes((propsOrClass as Record<string, unknown>) ?? {});
        const html = `<${tagName}${attrs}></${tagName}>`;
        return {
          html,
          errors: [],
          metrics: {
            tagName,
            renderTimeMs: 0,
            templateSize: 0,
            layer: 'dsd-static',
            hasError: false,
            nestingDepth: 0,
          },
          hydrationHints: [],
        };
      }
      componentClass = cls;
      props = (propsOrClass as Record<string, unknown>) ?? {};
    }
  } else {
    componentClass = input;
    tagName = (input as unknown as { tagName?: string }).tagName ?? 'unknown';
    props = (propsOrClass as Record<string, unknown>) ?? {};
  }

  const _nestingDepth = nestingDepth ?? 0;
  // H-10 fix: Guard against SSR environments where performance is undefined
  const startTime = typeof performance !== 'undefined' ? performance.now() : 0;
  const sourceStr = sourceInfo
    ? `${sourceInfo.route ? ` route="${sourceInfo.route}"` : ''}${
      sourceInfo.source ? ` source="${sourceInfo.source}"` : ''
    }`
    : '';

  const collectedErrors: RenderError[] = [];
  const collectedHints: HydrationHint[] = [];
  let hasError = false;

  // Build RenderInput for hooks
  const renderInput: RenderInput = {
    tagName,
    componentClass,
    props,
    dsdOptions,
    nestingDepth: _nestingDepth,
  };

  // -- Hook: beforeRender --------------------------------------
  if (hooks?.beforeRender) {
    try {
      hooks.beforeRender(renderInput);
    } catch (e) {
      log.debug(`beforeRender hook threw: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 1. Instantiate the component
  const instance = instantiateComponent(tagName, componentClass);
  if (!instance) {
    const errMsg = 'Failed to instantiate';
    const err = classifyError('instantiate', tagName, errMsg, false);
    collectedErrors.push(err);
    hasError = true;
    hooks?.onError?.(err);

    const html = instantiationErrorHtml(
      tagName,
      errMsg,
      sourceStr,
      sourceInfo?.route,
      sourceInfo?.source,
    );

    const result: RenderOutput = {
      html,
      errors: collectedErrors,
      metrics: {
        tagName,
        renderTimeMs: 0,
        templateSize: 0,
        layer: 'dsd-static',
        hasError: true,
        nestingDepth: _nestingDepth,
      },
      hydrationHints: collectedHints,
    };
    hooks?.afterRender?.(result);
    return result;
  }

  // 2. Set attributes/properties
  injectProps(instance, tagName, props);

  // 3. DO NOT call connectedCallback in SSR.
  // 4. Call render() to get Shadow DOM content
  let content = '';
  try {
    const result = instance.render();
    if (result == null) {
      content = '';
    } else if (typeof result === 'string') {
      content = result;
    } else if (isVNode(result)) {
      // v0.24.1 (SOP-003): JSX VNode path converts VNode tree to HTML string.
      // ADR-0071: Use renderDsdTree for single-pass traversal with
      // inline CE rendering.
      content = await renderDsdTree(result);
    } else {
      // v0.17.3: Multi-adapter dispatch - try all registered adapters
      // until one claims the result via isTemplate(). This allows Lit,
      // Vanilla, React, and future adapters to coexist.
      let rendered = false;
      for (const adapter of getRegisteredAdapters()) {
        if (adapter.isTemplate && adapter.render && adapter.isTemplate(result)) {
          content = await adapter.render(result, tagName);
          rendered = true;
          break;
        }
      }
      if (!rendered) {
        console.log(
          '[LessJS Debug] isVNode check failed for',
          tagName,
          'Object.keys:',
          Object.keys(result),
          'typeof result:',
          typeof result,
        );
        if (typeof result === 'object' && result !== null) {
          console.log(
            '[LessJS Debug] properties present:',
            'tag in result:',
            'tag' in result,
            'props in result:',
            'props' in result,
            'children in result:',
            'children' in result,
          );
        }
        const errDetail =
          `Components must return a string or VNode from render(), got ${typeof result}.`;
        const err = classifyError('render', tagName, errDetail, true);
        collectedErrors.push(err);
        hooks?.onError?.(err);
        content = wrongTypeErrorHtml(tagName, typeof result, errDetail);
      }
    }
  } catch (err) {
    const classifiedErr = classifyError('render', tagName, err, true);
    collectedErrors.push(classifiedErr);
    hasError = true;
    hooks?.onError?.(classifiedErr);

    // v0.19.1 Phase 6 (ADR-0035 A2): Bare-tag fallback on render failure.
    // Instead of producing broken DSD output with error comments inside
    // <template shadowrootmode="open">, return just the bare custom element
    // tag. The browser will upgrade it when JS loads - correct progressive
    // enhancement.
    const attrs = serializeAttributes(props);
    const renderEndFallback = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const fallbackResult: RenderOutput = {
      html: `<${tagName}${attrs}></${tagName}>`,
      errors: collectedErrors,
      metrics: {
        tagName,
        renderTimeMs: renderEndFallback - startTime,
        templateSize: 0,
        layer: 'dsd-static',
        hasError: true,
        nestingDepth: _nestingDepth,
      },
      hydrationHints: collectedHints,
    };
    hooks?.afterRender?.(fallbackResult);
    return fallbackResult;
  }

  // ADR-0071: renderDsdTree() already rendered all nested CEs inline during
  // the VNode traversal.

  // 5. Extract static styles from component class
  // v0.20.0: Try native DsdElement CSSStyleSheet first - no adapter needed.
  // v0.17.3: Fallback to registered adapters for framework-specific extraction.
  let styleCss = '';

  // Phase 1: Native DsdElement styles (CSSStyleSheet) - zero-dependency path
  const ctor = componentClass as unknown as {
    styles?: StyleSheetLike | StyleSheetLike[];
  };
  if (ctor.styles) {
    const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
    for (const sheet of sheets) {
      try {
        for (const rule of [...sheet.cssRules]) {
          styleCss += rule.cssText + '\n';
        }
      } catch {
        // Cross-origin stylesheet or empty sheet - skip silently
      }
    }
  }

  // Phase 2: Registered adapters (Lit, etc.) - only if no native styles found
  if (!styleCss) {
    for (const adapter of getRegisteredAdapters()) {
      if (adapter.extractStyles) {
        try {
          const extracted = adapter.extractStyles(componentClass);
          if (extracted) {
            styleCss += extracted;
          }
        } catch (e) {
          const styleErr = classifyError('style', tagName, e, true);
          collectedErrors.push(styleErr);
          hooks?.onError?.(styleErr);
          log.debug(
            `extractStyles failed for <${tagName}> via '${adapter.name}' adapter: ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
        }
      }
    }
  }

  // 6. Resolve component layer
  const resolvedLayer = dsdOptions?.layer || instance.layer || 'dsd-static';

  // --- Collect DSD render metrics (if collector provided) -----
  const renderEnd = typeof performance !== 'undefined'
    ? performance.now()
    : renderEndTimeFallback();
  const renderTimeMs = renderEnd - startTime;

  const metrics: DsdRenderMetrics = {
    tagName,
    renderTimeMs,
    templateSize: content.length,
    layer: resolvedLayer,
    hasError,
    nestingDepth: _nestingDepth,
  };

  if (collector) {
    collector.add(metrics);
  }

  // Collect hydration hint for this component
  if (resolvedLayer !== 'dsd-static') {
    collectedHints.push({
      tagName,
      layer: resolvedLayer as ComponentLayer,
    });
  }

  // 7. Wrap in DSD output
  const html = wrapDsdOutput({
    tagName,
    props,
    content,
    styleCss,
    layer: resolvedLayer,
    sourceStr,
    dsdOptions,
  });

  const output: RenderOutput = {
    html,
    errors: collectedErrors,
    metrics,
    hydrationHints: collectedHints,
  };

  // -- Hook: afterRender ---------------------------------------
  if (hooks?.afterRender) {
    try {
      hooks.afterRender(output);
    } catch (e) {
      log.debug(`afterRender hook threw: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return output;
}

/**
 * Fallback for renderEnd when performance is not available.
 */
function renderEndTimeFallback(): number {
  return Date.now();
}

/**
 * Render a component from the global Custom Element registry.
 * Looks up the class by tag name using customElements.get().
 *
 * v0.15.2: Returns `Promise<RenderOutput>`. Callers should destructure `html`.
 *
 * @param tagName - Registered custom element tag name
 * @param props - Attribute/property key-value pairs
 * @param sourceInfo - Optional context for error messages (route path, source file)
 * @param dsdOptions - Optional DSD template attributes
 * @param hooks - Optional render pipeline hooks
 * @returns Structured render output
 */
export async function renderDsdByName(
  tagName: string,
  props: Record<string, unknown> = {},
  sourceInfo?: { route?: string; source?: string },
  dsdOptions?: DsdOptions,
  hooks?: RenderHooks,
): Promise<RenderOutput> {
  return renderDsd(tagName, props, undefined, sourceInfo, dsdOptions, undefined, 0, hooks);
}

// v0.21.0: Streaming types and functions moved to render-dsd-stream.ts.
// Re-exported here for backward compatibility.
export { createRenderDsdStreamMetrics, renderDsdStream } from './render-dsd-stream.js';
export type {
  RenderDsdStreamChunk,
  RenderDsdStreamComponent,
  RenderDsdStreamMetrics,
  RenderDsdStreamOptions,
} from './render-dsd-stream.js';
