/**
 * @lessjs/core - JSX → DOM renderer (CSR path).
 *
 * Converts a VNode tree to real DOM nodes for client-side rendering and hydration.
 *
 * Design (ADR-0057):
 * - Event handlers (onClick) are wired via native addEventListener
 * - ref callbacks are invoked with the created element
 * - No synthetic event system — shadow DOM event bubbling is handled by the browser
 *
 * @module @lessjs/core/jsx-render-dom
 */

import { isVNode, type VNode } from './vnode.ts';
import { Fragment } from './jsx-runtime.ts';
import { isSignalLike, unwrapSignalLike } from './signal-like.ts';

// ─── SVG namespace support ────────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Elements that MUST be created with createElementNS(SVG_NS, tag) to render
 * correctly. Using createElement() puts them in the HTML namespace where
 * browsers won't render them as SVG shapes.
 */
const SVG_TAGS = new Set([
  'svg',
  'circle',
  'ellipse',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  'g',
  'defs',
  'clipPath',
  'mask',
  'pattern',
  'use',
  'symbol',
  'image',
  'text',
  'tspan',
  'textPath',
  'linearGradient',
  'radialGradient',
  'stop',
  'animate',
  'animateTransform',
  'animateMotion',
  'foreignObject',
  'title',
  'desc',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
]);

function createElementForTag(tag: string): Element {
  if (SVG_TAGS.has(tag)) {
    return document.createElementNS(SVG_NS, tag);
  }
  return document.createElement(tag);
}

// ─── applyProps ───────────────────────────────────────────────────────────────

/**
 * Apply a props object to a real DOM element.
 *
 * - `on*` handlers → addEventListener
 * - `ref` → invoke callback with element
 * - `style` object → assign to element.style
 * - Boolean values → setAttribute / removeAttribute
 * - `className` → `class` attribute
 * - `htmlFor` → `for` attribute
 * - Other values → setAttribute
 */
export function applyProps(
  el: Element,
  props: Record<string, unknown>,
  signal?: AbortSignal,
): void {
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'key') continue;

    // ref callback
    if (key === 'ref' && typeof value === 'function') {
      (value as (el: Element) => void)(el);
      continue;
    }

    // Event handlers
    if (key.startsWith('on') && typeof value === 'function') {
      const eventType = key.slice(2).toLowerCase();
      const opts: AddEventListenerOptions = signal ? { signal } : {};
      el.addEventListener(eventType, value as EventListener, opts);
      continue;
    }

    if (value == null) continue;

    // v0.24.3: Unwrap Signal-like values before handling any attribute
    const resolved = unwrapSignalLike(value);

    // style object — unwrap nested signal values
    if (key === 'style' && typeof resolved === 'object' && resolved !== null) {
      const styleObj: Record<string, string> = {};
      for (const [sk, sv] of Object.entries(resolved as Record<string, unknown>)) {
        styleObj[sk] = String(unwrapSignalLike(sv));
      }
      Object.assign((el as HTMLElement).style, styleObj);
      continue;
    }

    // Resolve attribute name
    const attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;

    // Boolean attributes
    if (typeof resolved === 'boolean') {
      if (resolved) {
        el.setAttribute(attrName, '');
      } else {
        el.removeAttribute(attrName);
      }
      continue;
    }

    // General
    el.setAttribute(attrName, String(resolved));
  }
}

// ─── renderToDOM ──────────────────────────────────────────────────────────────

/**
 * Render a VNode tree to a real DOM node.
 *
 * @param node - VNode, string, number, or null/undefined
 * @param signal - Optional AbortSignal for automatic event listener cleanup
 * @returns DOM Node (Element, Text, or DocumentFragment)
 */
export function renderToDOM(node: unknown, signal?: AbortSignal): Node {
  if (node == null || node === false) {
    return document.createTextNode('');
  }
  if (typeof node === 'string') {
    return document.createTextNode(node);
  }
  if (typeof node === 'number' || typeof node === 'boolean') {
    return document.createTextNode(String(node));
  }

  // v0.24.1: Auto-unwrap Signal values in JSX children (CSR parity with renderToString)
  if (isSignalLike(node)) {
    return renderToDOM((node as { value: unknown }).value, signal);
  }

  if (!isVNode(node)) {
    return document.createTextNode(String(node));
  }

  const { tag, props, children } = node as VNode;

  // ── Fragment ──────────────────────────────────────────────────────────────
  if (tag === Fragment || (typeof tag === 'symbol' && String(tag) === 'Symbol(lessjs.fragment)')) {
    const frag = document.createDocumentFragment();
    for (const child of children) {
      frag.appendChild(renderToDOM(child, signal));
    }
    return frag;
  }

  // ── Component function / class ────────────────────────────────────────────
  if (typeof tag === 'function') {
    try {
      if (tag.prototype && typeof tag.prototype.render === 'function') {
        // DsdElement class — CSR: create + connect
        const instance = new (tag as new (...args: unknown[]) => {
          render(): unknown;
          connectedCallback?(): void;
        })();
        for (const [k, v] of Object.entries(props)) {
          (instance as Record<string, unknown>)[k] = v;
        }
        const result = instance.render();
        return renderToDOM(result, signal);
      } else {
        // Function component
        const result = (tag as (props: Record<string, unknown>) => unknown)({
          ...props,
          children,
        });
        return renderToDOM(result, signal);
      }
    } catch {
      return document.createTextNode('');
    }
  }

  // ── HTML / SVG element ───────────────────────────────────────────────────
  const el = createElementForTag(tag as string);
  applyProps(el, props, signal);
  for (const child of children) {
    el.appendChild(renderToDOM(child, signal));
  }

  return el;
}
