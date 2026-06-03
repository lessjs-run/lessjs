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

/// <reference path="./jsx-types.d.ts" />

import type { ComponentCtor, ComponentFn, VNode } from './vnode.ts';

// ─── Fragment ────────────────────────────────────────────────────────────────

/**
 * Fragment symbol — groups children without emitting a wrapper element.
 *
 * Usage in TSX:
 *   return <><div>a</div><div>b</div></>;
 */
export const Fragment: unique symbol = Symbol.for('lessjs.fragment');

/** @internal Symbol for <Show> tag matching in renderToDom */
export const SHOW_TAG: unique symbol = Symbol.for('lessjs.show');
/** @internal Symbol for <For> tag matching in renderToDom */
export const FOR_TAG: unique symbol = Symbol.for('lessjs.for');

/**
 * Show conditional rendering factory (ADR-0059).
 *
 * Returns a VNode with the internal SHOW_TAG symbol so renderToDom
 * can intercept it as a control flow directive. Exported as a
 * function (not a Symbol) for TypeScript JSX compatibility.
 *
 * Usage: <Show when={this.#loading}><Spinner/><Content/></Show>
 */
export function Show(props: { when: unknown; children?: unknown }): VNode {
  return createVNode(SHOW_TAG, props as Record<string, unknown>);
}

/**
 * For list rendering factory (ADR-0059).
 *
 * Usage: <For each={this.#items}>{(item) => <li>{item.name}</li>}</For>
 */
export function For(props: { each: unknown; children?: unknown }): VNode {
  return createVNode(FOR_TAG, props as Record<string, unknown>);
}

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

type ComponentTag = string | ComponentFn | ComponentCtor | symbol;

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
// v0.24.2: Moved to jsx-types.d.ts — JSR does not allow declare global
// augmentations in published packages. The ambient declarations in
// jsx-types.d.ts provide the same TypeScript JSX type-checking.
