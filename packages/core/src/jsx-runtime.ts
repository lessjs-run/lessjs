/**
 * @lessjs/core - JSX Runtime.
 *
 * Implements the React-compatible jsx/jsxs/jsxDEV/Fragment interface.
 * Consumed by TypeScript/esbuild JSX transform when `jsxImportSource: "@lessjs/core"`.
 *
 * Design (ADR-0057):
 * - jsx() / jsxs() return pure JavaScript VNode objects — zero DOM dependency
 * - Fragment groups multiple children without a wrapping element
 * - jsxDEV adds source-map information in development builds
 *
 * @module @lessjs/core/jsx-runtime
 */

import type { VNode } from './vnode.ts';

// ─── Fragment ────────────────────────────────────────────────────────────────

/**
 * Fragment symbol — groups children without emitting a wrapper element.
 *
 * Usage in TSX:
 *   return <><div>a</div><div>b</div></>;
 */
export const Fragment: unique symbol = Symbol.for('lessjs.fragment');

// ─── Internal helper ─────────────────────────────────────────────────────────

function normaliseChildren(raw: unknown): (VNode | string)[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.flat(Infinity).filter((c) => c != null && c !== false && c !== true) as (
      | VNode
      | string
    )[];
  }
  if (raw === false || raw === true) return [];
  return [raw as VNode | string];
}

// deno-lint-ignore ban-types
type ComponentTag = string | Function;

function createVNode(
  tag: ComponentTag | typeof Fragment,
  props: Record<string, unknown>,
  key?: string | number,
): VNode {
  const { children, ref, ...rest } = props as Record<string, unknown> & {
    children?: unknown;
    ref?: (el: Element) => void;
  };
  const childArray = normaliseChildren(children);
  const vnode: VNode = { tag, props: rest, children: childArray };
  if (key !== undefined) vnode.key = key;
  if (ref !== undefined) vnode.ref = ref as (el: Element) => void;
  return vnode;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * JSX factory for 0–1 children.
 * Called by the TypeScript JSX transform for elements with a single child.
 */
export function jsx(
  tag: ComponentTag | typeof Fragment,
  props: Record<string, unknown>,
  key?: string | number,
): VNode {
  return createVNode(tag, props, key);
}

/**
 * JSX factory for ≥2 children.
 * Called by the TypeScript JSX transform for elements with multiple children.
 * Semantically identical to `jsx` — the distinction is made by the transform.
 */
export function jsxs(
  tag: ComponentTag | typeof Fragment,
  props: Record<string, unknown>,
  key?: string | number,
): VNode {
  return createVNode(tag, props, key);
}

/**
 * JSX factory for development mode.
 * Same as `jsx` but receives source-map information for better error messages.
 */
export function jsxDEV(
  tag: ComponentTag | typeof Fragment,
  props: Record<string, unknown>,
  key?: string | number,
  _isStaticChildren?: boolean,
  source?: { fileName: string; lineNumber: number; columnNumber: number },
  _self?: unknown,
): VNode {
  const vnode = createVNode(tag, props, key);
  if (source) {
    // Attach debug source info — stripped in production builds
    (vnode as VNode & { __source?: unknown }).__source = source;
  }
  return vnode;
}

// ─── JSX IntrinsicElements type declarations ──────────────────────────────────

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: Record<string, unknown>;
    }
  }
}
