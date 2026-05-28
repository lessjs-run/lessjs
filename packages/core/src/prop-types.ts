/**
 * @lessjs/core - static props TypeScript type utilities.
 *
 * Provides `PropDecl`, `PropType`, and `PropsFrom<P>` for inferring
 * the TypeScript types of `static props` declarations.
 *
 * Usage:
 * ```ts
 * class MyCounter extends DsdElement {
 *   static props = {
 *     count: Number,
 *     label: { type: String, default: 'hello', reflect: true },
 *   };
 *   // this.count → number
 *   // this.label → string
 * }
 * ```
 *
 * @module @lessjs/core/prop-types
 */

// ─── PropDecl ─────────────────────────────────────────────────────────────────

/** Shorthand form: `count: Number` */
export type PropDeclShorthand =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ArrayConstructor
  | ObjectConstructor;

/** Full-form declaration: `{ type: Number, default: 0, reflect: false }` */
export type PropDeclFull =
  | { type: StringConstructor; default?: string; reflect?: boolean }
  | { type: NumberConstructor; default?: number; reflect?: boolean }
  | { type: BooleanConstructor; default?: boolean; reflect?: boolean }
  | { type: ArrayConstructor; default?: unknown[]; reflect?: boolean }
  | { type: ObjectConstructor; default?: Record<string, unknown>; reflect?: boolean };

/** Union of all valid prop declaration forms */
export type PropDecl = PropDeclShorthand | PropDeclFull;

// ─── PropType ─────────────────────────────────────────────────────────────────

/**
 * Maps a `PropDecl` to its runtime TypeScript type.
 *
 * @example
 * PropType<NumberConstructor>                   → number
 * PropType<{ type: StringConstructor }>         → string
 * PropType<{ type: BooleanConstructor }>        → boolean
 */
export type PropType<D> = D extends NumberConstructor ? number
  : D extends StringConstructor ? string
  : D extends BooleanConstructor ? boolean
  : D extends ArrayConstructor ? unknown[]
  : D extends ObjectConstructor ? Record<string, unknown>
  : D extends { type: NumberConstructor } ? number
  : D extends { type: StringConstructor } ? string
  : D extends { type: BooleanConstructor } ? boolean
  : D extends { type: ArrayConstructor } ? unknown[]
  : D extends { type: ObjectConstructor } ? Record<string, unknown>
  : unknown;

// ─── PropsFrom ────────────────────────────────────────────────────────────────

/**
 * Maps a `static props` record to the TypeScript type of each property.
 *
 * @example
 * PropsFrom<{ count: NumberConstructor; label: StringConstructor }>
 *   → { count: number; label: string }
 */
export type PropsFrom<P extends Record<string, PropDecl>> = {
  [K in keyof P]: PropType<P[K]>;
};
