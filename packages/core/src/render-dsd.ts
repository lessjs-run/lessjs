/**
 * @lessjs/core - DSD Renderer.
 *
 * Pure string-based Declarative Shadow DOM SSR renderer.
 * Framework-agnostic: no Lit dependency and no TemplateResult knowledge.
 *
 * v0.29.1: Inlined render-errors, render-instantiate, and render-serialize helpers.
 * Uses unified serializeAttrs from render-ir. Removed renderDsdByName.
 * Changed renderDsdTree import from jsx-render-string to render-ir.
 *
 * @module @lessjs/core/render-dsd
 */

import {
  type ComponentLayer,
  type DsdComponentConstructor,
  type DsdOptions,
  type DsdRenderCollector,
  type DsdRenderMetrics,
  type HydrationHint,
  type RenderError,
  type RenderHooks,
  type RenderInput,
  type RenderOutput,
} from './types.js';
import { getDefaultRegistry } from './adapter-registry.js';
import { createLogger } from './logger.js';
import { escapeAttrValue } from './html-escape.js';
import { isVNode } from './vnode.js';
import { renderDsdTree } from './render-ir.js';
import { dsdHostNode, serializeAttrs, serializeRenderNode, trustedHtmlNode } from './render-ir.js';
import { DANGEROUS_KEYS } from './security.js';
import type { DsdComponent } from './types.js';

const log = createLogger('core');
const _textEncoder = new TextEncoder();

// ─── Error Classification ──────────────────────────────────────

export type RenderPhase = 'instantiate' | 'render' | 'nested' | 'style' | 'serialize';

export type RenderErrorCode =
  | 'LESS_RENDER_INSTANTIATE_FAILED'
  | 'LESS_RENDER_INVALID_OUTPUT'
  | 'LESS_RENDER_RENDER_FAILED'
  | 'LESS_RENDER_NESTED_FAILED'
  | 'LESS_RENDER_STYLE_FAILED'
  | 'LESS_RENDER_SERIALIZE_FAILED';

export function classifyError(
  phase: RenderPhase,
  tagName: string,
  err: unknown,
  recoverable = false,
): RenderError {
  const message = err instanceof Error ? err.message : String(err);
  return {
    code: codeForRenderError(phase, message),
    severity: recoverable ? 'warning' : 'error',
    phase,
    tagName,
    message,
    recoverable,
  };
}

function codeForRenderError(phase: RenderPhase, message: string): RenderErrorCode {
  if (phase === 'instantiate') return 'LESS_RENDER_INSTANTIATE_FAILED';
  if (phase === 'nested') return 'LESS_RENDER_NESTED_FAILED';
  if (phase === 'style') return 'LESS_RENDER_STYLE_FAILED';
  if (phase === 'serialize') return 'LESS_RENDER_SERIALIZE_FAILED';
  if (message.includes('Components must return a string') || message.includes('TemplateResult')) {
    return 'LESS_RENDER_INVALID_OUTPUT';
  }
  return 'LESS_RENDER_RENDER_FAILED';
}

function instantiationErrorHtml(
  tagName: string,
  _errMsg: string,
  _sourceStr: string,
  _route?: string,
  _source?: string,
): string {
  return `<${tagName}></${tagName}>`;
}

function wrongTypeErrorHtml(
  tagName: string,
  resultType: string,
  errDetail: string,
): string {
  log.error(
    `<${tagName}> render() returned ${resultType} instead of string. ${errDetail}`,
  );
  return `<!-- Render Error: <${tagName}> render() returned ${resultType}, expected string. ${errDetail} -->`;
}

// ─── Component Instantiation ───────────────────────────────────

function instantiateComponent(
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

function injectProps(
  instance: DsdComponent,
  tagName: string,
  props: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(props)) {
    if (DANGEROUS_KEYS.has(key)) {
      log.warn(
        `Skipping dangerous prop key "${key}" on <${tagName}> - potential prototype pollution`,
      );
      continue;
    }
    try {
      (instance as Record<string, unknown>)[key] = value;
    } catch (e) {
      log.debug(
        `Cannot set read-only property "${key}" on <${tagName}>: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }
}

// ─── DSD Template Attributes ───────────────────────────────────

function buildDsdTemplateAttrs(options?: DsdOptions): string {
  if (!options) return '';
  const parts: string[] = [];
  if (options.delegatesFocus) parts.push(' shadowrootdelegatesfocus');
  if (options.clonable) parts.push(' shadowrootclonable');
  if (options.serializable) parts.push(' shadowrootserializable');
  if (options.slotAssignment === 'manual') {
    parts.push(' shadowrootslotassignment="manual"');
  }
  if (options.customElementRegistry) {
    parts.push(' shadowrootcustomelementregistry');
  }
  return parts.join('');
}

// ─── DSD Output Wrapping ───────────────────────────────────────

function wrapDsdOutput(params: {
  tagName: string;
  props: Record<string, unknown>;
  content: string;
  styleCss: string;
  layer: string;
  sourceStr: string;
  dsdOptions?: DsdOptions;
  lightDom?: import('../src/render-ir.ts').RenderNode[];
}): string {
  const { tagName, props, content, styleCss, layer, sourceStr, dsdOptions, lightDom } = params;
  const ssrPropsAttr = Object.keys(props).length > 0
    ? ` data-ssr-props="${escapeAttrValue(JSON.stringify(props))}"`
    : '';

  return serializeRenderNode(
    dsdHostNode({
      tag: tagName,
      attrs: props,
      ssrPropsAttr,
      source: sourceStr,
      templateAttrs: buildDsdTemplateAttrs(dsdOptions),
      styleCss,
      shadow: [trustedHtmlNode(content)],
      light: lightDom ?? [],
      layer,
    }),
  );
}

// ─── DSD Rendering ─────────────────────────────────────────────

export interface RenderDsdOptions {
  componentClass?: CustomElementConstructor;
  props?: Record<string, unknown>;
  sourceInfo?: { route?: string; source?: string };
  dsdOptions?: DsdOptions;
  collector?: DsdRenderCollector;
  nestingDepth?: number;
  hooks?: RenderHooks;
  lightDom?: import('../src/render-ir.ts').RenderNode[];
}

export async function renderDsd(
  input: string | CustomElementConstructor,
  options: RenderDsdOptions = {},
): Promise<RenderOutput> {
  let tagName: string;
  let componentClass: CustomElementConstructor;
  const props = options.props ?? {};

  if (typeof input === 'string') {
    tagName = input;
    if (options?.componentClass) {
      componentClass = options.componentClass;
    } else {
      const cls = globalThis.customElements?.get(tagName) as CustomElementConstructor | undefined;
      if (!cls) {
        log.warn(`<${tagName}> is not registered - rendering as void element`);
        const attrs = serializeAttrs(tagName, props);
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
    }
  } else {
    componentClass = input;
    tagName = (input as DsdComponentConstructor).tagName ?? 'unknown';
  }

  const sourceInfo = options.sourceInfo;
  const dsdOptions = options.dsdOptions;
  const collector = options.collector;
  const nestingDepth = options.nestingDepth;
  const hooks = options.hooks;

  const _nestingDepth = nestingDepth ?? 0;
  const startTime = typeof performance !== 'undefined' ? performance.now() : 0;
  const sourceStr = sourceInfo
    ? `${sourceInfo.route ? ` route="${sourceInfo.route}"` : ''}${
      sourceInfo.source ? ` source="${sourceInfo.source}"` : ''
    }`
    : '';

  const collectedErrors: RenderError[] = [];
  const collectedHints: HydrationHint[] = [];
  let hasError = false;

  const renderInput: RenderInput = {
    tagName,
    componentClass,
    props,
    dsdOptions,
    nestingDepth: _nestingDepth,
  };

  if (hooks?.beforeRender) {
    try {
      hooks.beforeRender(renderInput);
    } catch (e) {
      log.debug(`beforeRender hook threw: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

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

  injectProps(instance, tagName, props);

  let content = '';
  try {
    const result = instance.render();
    if (result == null) {
      content = '';
    } else if (isVNode(result)) {
      content = await renderDsdTree(result);
    } else if (typeof result === 'string') {
      log.warn(`<${tagName}> render() returned string — deprecated. Use VNode instead.`);
      content = result;
    } else {
      let rendered = false;
      for (const adapter of getDefaultRegistry().getAll()) {
        if (adapter.isTemplate && adapter.render && adapter.isTemplate(result)) {
          content = await adapter.render(result, tagName);
          rendered = true;
          break;
        }
      }
      if (!rendered) {
        log.debug(`Unsupported render() return for <${tagName}>: ${describeRenderValue(result)}`);
        const errDetail = `Components must return a VNode from render(), got ${typeof result}.`;
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

    const attrs = serializeAttrs(tagName, props);
    const renderEndFallback = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const fallbackResult: RenderOutput = {
      html: `<${tagName}${attrs}></${tagName}>`,
      errors: collectedErrors,
      metrics: {
        tagName,
        renderTimeMs: renderEndFallback - startTime,
        templateSize: 0,
        layer: 'dsd-static',
        hasError: hasError,
        nestingDepth: _nestingDepth,
      },
      hydrationHints: collectedHints,
    };
    hooks?.afterRender?.(fallbackResult);
    return fallbackResult;
  }

  let styleCss = '';

  const ctor = componentClass as DsdComponentConstructor;
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

  if (!styleCss) {
    for (const adapter of getDefaultRegistry().getAll()) {
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

  const resolvedLayer = dsdOptions?.layer || instance.layer || 'dsd-static';

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

  if (resolvedLayer !== 'dsd-static') {
    collectedHints.push({
      tagName,
      layer: resolvedLayer as ComponentLayer,
    });
  }

  const html = wrapDsdOutput({
    tagName,
    props,
    content,
    styleCss,
    layer: resolvedLayer,
    sourceStr,
    dsdOptions,
    lightDom: options.lightDom,
  });

  const output: RenderOutput = {
    html,
    errors: collectedErrors,
    metrics,
    hydrationHints: collectedHints,
  };

  if (hooks?.afterRender) {
    try {
      hooks.afterRender(output);
    } catch (e) {
      log.debug(`afterRender hook threw: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return output;
}

function renderEndTimeFallback(): number {
  return Date.now();
}

function describeRenderValue(value: unknown): string {
  if (value === null || typeof value !== 'object') return typeof value;
  const keys = Object.keys(value).join(',');
  return `object keys=[${keys}]`;
}

// v0.21.0: Streaming types and functions moved to render-dsd-stream.ts.
export { createRenderDsdStreamMetrics, renderDsdStream } from './render-dsd-stream.js';
export type {
  RenderDsdStreamChunk,
  RenderDsdStreamComponent,
  RenderDsdStreamMetrics,
  RenderDsdStreamOptions,
} from './render-dsd-stream.js';
