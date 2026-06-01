/**
 * @lessjs/core - VNode interface definition.
 *
 * VNode is the intermediate representation of a component's declarative output.
 * It is a pure JS object — zero DOM dependency, zero runtime binding.
 *
 * ⚠️ VNode 接口冻结条款 (ADR-0057 §1.1):
 * v1.0 前只允许以下 5 个字段，不增加 hooks/memo/suspense/context/portal。
 * 任何新字段提案必须走 ADR 流程，并证明它不引入 VDOM diff 语义。
 *
 * @module @lessjs/core/vnode
 */

// ─── VNode interface ─────────────────────────────────────────────────────────

/**
 * LessJS declarative component description.
 *
 * VNode represents a single element or component in the virtual tree.
 * It is consumed once per render (SSR: to HTML string, CSR: to real DOM).
 * LessJS intentionally does NOT diff VNode trees — DSD is the ground truth.
 */
export interface VNode {
  /** HTML tag name (e.g. 'div'), component function/class, or Fragment symbol */
  // deno-lint-ignore ban-types
  tag: string | Function | symbol;
  /** Attribute object (includes events, class, style, etc.) */
  props: Record<string, unknown>;
  /** Child nodes (VNode or text string) */
  children: (VNode | string)[];
  /** Optional key for list rendering */
  key?: string | number;
  /** Optional ref callback — called with the DOM element after mount */
  ref?: (el: Element) => void;
}

// ─── Type guard ──────────────────────────────────────────────────────────────

/**
 * Returns true if the given value is a VNode object.
 */
export function isVNode(v: unknown): v is VNode {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;

  const candidate = v as {
    tag?: unknown;
    props?: unknown;
    children?: unknown;
  };
  const tagType = typeof candidate.tag;

  return (
    (tagType === 'string' || tagType === 'function' || tagType === 'symbol') &&
    typeof candidate.props === 'object' &&
    candidate.props !== null &&
    !Array.isArray(candidate.props) &&
    Array.isArray(candidate.children)
  );
}
