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
  /** JSX expression result — VNode objects from jsx-runtime */
  interface Element {
    tag: string | Function | symbol;
    props: Record<string, unknown>;
    children: unknown[];
    key?: string | number;
    ref?: (el: Element) => void;
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
