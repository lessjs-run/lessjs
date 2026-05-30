/**
 * @lessjs/core - JSX type declarations.
 *
 * Required by TypeScript's `jsx: "react-jsx"` mode.
 * Defines JSX.Element as VNode so function components returning VNode
 * are recognized as valid JSX component types.
 *
 * @module @lessjs/core/jsx-types
 */

declare namespace JSX {
  /**
   * JSX expression result — structurally compatible with VNode.
   *
   * children must match VNode.children: (VNode | string)[] to satisfy
   * TypeScript's structural assignability check when a JSX expression
   * (this Element) is returned from DsdElement.render(): string | VNode.
   */
  interface Element {
    // deno-lint-ignore ban-types
    tag: string | Function | symbol;
    props: Record<string, unknown>;
    children: (string | import('./vnode.ts').VNode)[];
    key?: string | number;
    ref?: (el: globalThis.Element) => void;
  }

  interface ElementClass {
    render(): unknown;
  }

  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }

  interface ElementAttributesProperty {
    props: Record<string, unknown>;
  }

  interface ElementChildrenAttribute {
    children: unknown;
  }
}
