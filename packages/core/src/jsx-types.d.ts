/**
 * @lessjs/core - JSX intrinsic elements type declarations.
 *
 * Provides type information for HTML/SVG elements in JSX,
 * required by TypeScript's `jsx: "react-jsx"` mode.
 *
 * @module @lessjs/core/jsx-types
 */

declare namespace JSX {
  interface IntrinsicElements {
    // HTML elements
    [elemName: string]: Record<string, unknown>;
  }
}
