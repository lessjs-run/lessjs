/**
 * Component adapter protocol.
 *
 * Component adapters connect openElement render semantics to component models
 * without making the protocol package depend on those implementations.
 */

import type { ComponentLayer, HydrationStrategy } from './renderer.ts';

export interface ComponentDescriptor<
  Props extends Record<string, unknown> = Record<string, unknown>,
> {
  tagName: string;
  layer?: ComponentLayer;
  hydrate?: HydrationStrategy;
  props?: Props;
}

export interface ComponentAdapter<Component = unknown> {
  name: string;
  isComponent(value: unknown): value is Component;
  describe(component: Component, tagName: string): ComponentDescriptor;
}
