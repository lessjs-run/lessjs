import { DsdElement } from './dsd-element.ts';

/**
 * Product-facing Elements base class.
 *
 * `OpenElement` is the v0.40 authoring name for native Web Components built on
 * the existing DSD/shadow implementation. It intentionally aliases the current
 * `DsdElement` behavior so Elements can migrate naming without changing render
 * semantics or package topology in the same step.
 */
export class OpenElement extends DsdElement {}
