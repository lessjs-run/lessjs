/**
 * @lessjs/core - JSX → HTML string renderer.
 *
 * Converts a VNode tree to an HTML string for SSR/SSG output.
 *
 * Design (ADR-0057):
 * - Pure string concatenation — zero DOM dependency, works in any runtime
 * - Event handlers (onClick etc.) are silently ignored (CSR-only)
 * - ref callbacks are silently ignored (DOM-only)
 * - Completes in a single recursive pass
 *
 * @module @lessjs/core/jsx-render-string
 */

import { isVNode, type VNode } from './vnode.ts';
import { FOR_TAG, Fragment, SHOW_TAG } from './jsx-runtime.ts';
import { escapeAttr, escapeHtml } from './html-escape.ts';
import { isSignalLike, unwrapSignalLike } from './signal-like.ts';
import { createEventMarkerContext, serializeEventMarkers } from './event-hydration.ts';
import { renderDsd } from './render-dsd.js';

// ─── Void elements ───────────────────────────────────────────────────────────

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

function insertLightDomIntoDsdHost(html: string, tagName: string, lightDom: string): string {
  if (!lightDom) return html;

  const closingTag = `</${tagName}>`;
  const index = html.lastIndexOf(closingTag);
  if (index === -1) {
    return html + lightDom;
  }

  return html.slice(0, index) + lightDom + html.slice(index);
}

// ─── Attribute serialisation ──────────────────────────────────────────────────

/**
 * Serialise a props object to an HTML attribute string (with leading space when non-empty).
 *
 * Rules:
 * - `children` prop is skipped (handled as child nodes)
 * - `ref` prop is skipped (DOM-only)
 * - `key` prop is skipped (reconciliation hint only)
 * - `on*` handlers are skipped (CSR-only, not serialised to HTML)
 * - Function values are skipped
 * - Boolean `true` emits the attribute with empty value; `false`/`null`/`undefined` omits it
 * - `class` and `className` are both supported (className → class)
 * - `htmlFor` → `for`
 * - `style` object is serialised to a CSS string
 * - All values are HTML-attribute-escaped
 */
function serializeAttrs(props: Record<string, unknown>): string {
  let result = '';
  for (const [key, value] of Object.entries(props)) {
    // Skip non-attribute props
    if (key === 'children' || key === 'ref' || key === 'key') continue;
    // Skip event handlers
    if (key.startsWith('on') && typeof value === 'function') continue;
    // Skip all function values
    if (typeof value === 'function') continue;
    // Skip null / undefined
    if (value == null) continue;

    // innerHTML is a DOM-only prop — skip during SSR attribute serialization.
    // Content is rendered as raw children in the caller.
    if (key === 'innerHTML') continue;

    // textContent is a DOM property — rendered as child content, not as an HTML attribute.
    if (key === 'textContent') continue;

    // Resolve attribute name
    let attrName: string;
    if (key === 'className') {
      attrName = 'class';
    } else if (key === 'htmlFor') {
      attrName = 'for';
    } else {
      attrName = key;
    }

    // v0.24.3: Unwrap Signal-like values before handling attributes
    const resolved = unwrapSignalLike(value);

    // Boolean attributes
    if (typeof resolved === 'boolean') {
      if (resolved) result += ` ${attrName}`;
      continue;
    }

    // Style object → inline CSS string (unwrap nested signal values)
    if (key === 'style' && typeof resolved === 'object' && resolved !== null) {
      const styleObj: Record<string, unknown> = {};
      for (const [sk, sv] of Object.entries(resolved as Record<string, unknown>)) {
        styleObj[sk] = unwrapSignalLike(sv);
      }
      const css = styleObjectToString(styleObj);
      if (css) result += ` style="${escapeAttr(css)}"`;
      continue;
    }

    // General attributes
    result += ` ${attrName}="${escapeAttr(String(resolved))}"`;
  }
  return result;
}

function styleObjectToString(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .filter(([, v]) => v != null)
    .map(([k, v]) => {
      // camelCase → kebab-case
      const prop = k.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
      return `${prop}: ${v}`;
    })
    .join('; ');
}

// ─── renderToString ───────────────────────────────────────────────────────────

/**
 * Render a VNode tree to an HTML string.
 *
 * @param node - VNode, string, number, boolean, null or undefined
 * @returns HTML string (empty string for null/undefined/false)
 */
export function renderToString(
  node: unknown,
  eventContext = createEventMarkerContext(),
): string {
  // Falsy / empty nodes
  if (node == null || node === false) return '';
  if (typeof node === 'string') return escapeHtml(node);
  if (typeof node === 'number') return String(node);
  if (typeof node === 'boolean') return '';

  // v0.24.1: Auto-unwrap Signal values in JSX expressions
  if (isSignalLike(node)) {
    return renderToString((node as { value: unknown }).value);
  }

  if (!isVNode(node)) {
    // Unknown value — coerce to string
    return escapeHtml(String(node));
  }

  const { tag, props, children } = node;

  // ── Fragment ──────────────────────────────────────────────────────────────
  if (tag === Fragment || (typeof tag === 'symbol' && String(tag) === 'Symbol(lessjs.fragment)')) {
    return children.map((c) => renderToString(c, eventContext)).join('');
  }

  // ── Show (SSR: render truthy child as static snapshot) ────────────────────
  if (tag === SHOW_TAG || tag === 'show') {
    const whenVal = isSignalLike(props?.when)
      ? (props!.when as { value: unknown }).value
      : props?.when;
    const ch = children as VNode[];
    const target = whenVal ? ch[0] : ch[1];
    return target ? renderToString(target, eventContext) : '';
  }

  // ── For (SSR: render each item statically) ────────────────────────────────
  if (tag === FOR_TAG || tag === 'fore') {
    const items = (isSignalLike(props?.each)
      ? (props!.each as { value: unknown }).value
      : props?.each) as unknown[];
    if (!Array.isArray(items)) {
      return '';
    }
    const renderFn = children[0] as unknown as ((item: unknown, idx: number) => unknown);
    if (typeof renderFn !== 'function') {
      return '';
    }
    return items.map((item, i) =>
      renderToString(renderFn(item, i), eventContext)
    ).join('');
  }

  // ── Component function / class ────────────────────────────────────────────
  if (typeof tag === 'function') {
    // DsdElement class: instantiate + call render() via renderToString recursion
    // Function components: call directly
    try {
      // Check if it's a class (has a prototype.render)
      if (tag.prototype && typeof tag.prototype.render === 'function') {
        // DsdElement subclass — SSR: create instance, inject props, call render()
        // This path is handled by render-dsd.ts; here we delegate to a simple fallback
        const instance = new (tag as new (
          ...args: unknown[]
        ) => { render(): unknown })();
        // Inject props as own properties
        for (const [k, v] of Object.entries(props)) {
          (instance as Record<string, unknown>)[k] = v;
        }
        const result = instance.render();
        return renderToString(result, eventContext);
      } else {
        // Function component
        const result = (tag as (props: Record<string, unknown>) => unknown)({
          ...props,
          children,
        });
        return renderToString(result, eventContext);
      }
    } catch (err) {
      // v0.26.1 FIX: Previously this silently returned '', making SSR failures
      // invisible. Now we log the error so it's visible in build logs (e.g. CF Pages).
      console.error(
        `[LessJS/SSR] renderToString() failed for <${String(tag)}>:`,
        err instanceof Error ? err.message : String(err),
      );
      return '';
    }
  }

  // ── HTML element ──────────────────────────────────────────────────────────
  const attrs = serializeAttrs(props);

  // v0.28 (ADR-0067): Emit data-on-<event> markers for event handler props.
  // Handlers map: onClick→click, onInput→input, onChange→change, onSubmit→submit, onKeydown→keydown
  const eventAttrs = serializeEventMarkers(props, eventContext);

  // innerHTML prop: render as raw HTML content (build-time sanitized, ADR-0064)
  const innerHTML = props?.innerHTML !== undefined
    ? String(unwrapSignalLike(props.innerHTML))
    : undefined;
  // textContent prop: render signal/dynamic value as escaped child content (v0.27)
  // Signal identity preserved via data-signal attribute for hydration.
  const textContent = props?.textContent !== undefined
    ? escapeHtml(String(unwrapSignalLike(props.textContent)))
    : undefined;
  const childHtml = innerHTML !== undefined
    ? innerHTML
    : textContent !== undefined
    ? textContent
    : children.map((c) => renderToString(c, eventContext)).join('');

  const tagStr = String(tag);

  if (VOID_ELEMENTS.has(tagStr)) {
    return `<${tagStr}${attrs}${eventAttrs}>`;
  }

  return `<${tagStr}${attrs}${eventAttrs}>${childHtml}</${tagStr}>`;
}

// ─── renderNestedDsd ────────────────────────────────────────────────────────

/**
 * Render a VNode tree to an HTML string with inline nested CE rendering.
 *
 * Unlike `renderToString` (which outputs empty tags for custom elements),
 * `renderNestedDsd` calls `renderDsd()` inline whenever it encounters a
 * registered custom element tag, so the output already contains the DSD
 * template without a serialized-markup post-process.
 *
 * ADR-0071: Single-pass VNode traversal from author tree to DSD HTML.
 *
 * @param node - VNode, string, number, boolean, null or undefined
 * @returns HTML string with all nested CEs pre-rendered via DSD
 */
export async function renderNestedDsd(
  node: unknown,
  eventContext = createEventMarkerContext(),
): Promise<string> {
  // Falsy / empty nodes
  if (node == null || node === false) return '';
  if (typeof node === 'string') return escapeHtml(node);
  if (typeof node === 'number') return String(node);
  if (typeof node === 'boolean') return '';

  // v0.24.1: Auto-unwrap Signal values in JSX expressions
  if (isSignalLike(node)) {
    return renderNestedDsd((node as { value: unknown }).value, eventContext);
  }

  if (!isVNode(node)) {
    return escapeHtml(String(node));
  }

  const { tag, props, children } = node;

  // ── Fragment ──────────────────────────────────────────────────────────────
  if (tag === Fragment || (typeof tag === 'symbol' && String(tag) === 'Symbol(lessjs.fragment)')) {
    const parts: string[] = [];
    for (const c of children) {
      parts.push(await renderNestedDsd(c, eventContext));
    }
    return parts.join('');
  }

  // ── Show (SSR: render truthy child as static snapshot) ────────────────────
  if (tag === SHOW_TAG || tag === 'show') {
    const whenVal = isSignalLike(props?.when)
      ? (props!.when as { value: unknown }).value
      : props?.when;
    const ch = children as VNode[];
    const target = whenVal ? ch[0] : ch[1];
    return target ? renderNestedDsd(target, eventContext) : '';
  }

  // ── For (SSR: render each item statically) ────────────────────────────────
  if (tag === FOR_TAG || tag === 'fore') {
    const items = (isSignalLike(props?.each)
      ? (props!.each as { value: unknown }).value
      : props?.each) as unknown[];
    if (!Array.isArray(items)) {
      return '';
    }
    const renderFn = children[0] as unknown as ((item: unknown, idx: number) => unknown);
    if (typeof renderFn !== 'function') {
      return '';
    }
    const parts: string[] = [];
    for (let i = 0; i < items.length; i++) {
      parts.push(await renderNestedDsd(renderFn(items[i], i), eventContext));
    }
    return parts.join('');
  }

  // ── Component function / class ────────────────────────────────────────────
  if (typeof tag === 'function') {
    try {
      if (tag.prototype && typeof tag.prototype.render === 'function') {
        const instance = new (tag as new (...args: unknown[]) => { render(): unknown })();
        for (const [k, v] of Object.entries(props)) {
          (instance as Record<string, unknown>)[k] = v;
        }
        const result = instance.render();
        return renderNestedDsd(result, eventContext);
      } else {
        const result = (tag as (props: Record<string, unknown>) => unknown)({
          ...props,
          children,
        });
        return renderNestedDsd(result, eventContext);
      }
    } catch (err) {
      console.error(
        `[LessJS/SSR] renderNestedDsd() failed for <${String(tag)}>:`,
        err instanceof Error ? err.message : String(err),
      );
      return '';
    }
  }

  // ── HTML element / Custom Element ─────────────────────────────────────────
  const tagStr = String(tag);

  // ADR-0071: If this is a registered custom element, render it inline via
  // renderDsd() so its DSD template is embedded in this traversal.
  if (
    typeof customElements !== 'undefined' &&
    customElements.get &&
    customElements.get(tagStr)
  ) {
    try {
      const dsdResult = await renderDsd(
        tagStr,
        customElements.get(tagStr) as CustomElementConstructor,
        props,
      );
      const parts: string[] = [];
      for (const c of children) {
        parts.push(await renderNestedDsd(c, eventContext));
      }
      return insertLightDomIntoDsdHost(dsdResult.html, tagStr, parts.join(''));
    } catch (err) {
      console.error(
        `[LessJS/SSR] renderNestedDsd() failed for registered CE <${tagStr}>:`,
        err instanceof Error ? err.message : String(err),
      );
      // Fallback: render as empty CE tag (browser will upgrade on CSR)
      const attrs = serializeAttrs(props);
      const eventAttrs = serializeEventMarkers(props, eventContext);
      const parts: string[] = [];
      for (const c of children) {
        parts.push(await renderNestedDsd(c, eventContext));
      }
      return `<${tagStr}${attrs}${eventAttrs}>${parts.join('')}</${tagStr}>`;
    }
  }

  // ── Normal HTML element ───────────────────────────────────────────────────
  const attrs = serializeAttrs(props);
  const eventAttrs = serializeEventMarkers(props, eventContext);

  const innerHTML = props?.innerHTML !== undefined
    ? String(unwrapSignalLike(props.innerHTML))
    : undefined;
  const textContent = props?.textContent !== undefined
    ? escapeHtml(String(unwrapSignalLike(props.textContent)))
    : undefined;

  let childHtml: string;
  if (innerHTML !== undefined) {
    childHtml = innerHTML;
  } else if (textContent !== undefined) {
    childHtml = textContent;
  } else {
    const parts: string[] = [];
    for (const c of children) {
      parts.push(await renderNestedDsd(c, eventContext));
    }
    childHtml = parts.join('');
  }

  if (VOID_ELEMENTS.has(tagStr)) {
    return `<${tagStr}${attrs}${eventAttrs}>`;
  }

  return `<${tagStr}${attrs}${eventAttrs}>${childHtml}</${tagStr}>`;
}
