/**
 * Island metadata protocol.
 *
 * Island bundling remains implementation-owned. This module defines the
 * portable metadata needed by renderers, route manifests, and runtimes.
 */

import type { HydrationStrategy } from './renderer.ts';

export interface IslandConfig {
  ssr?: boolean;
  dsd?: boolean;
  hydrate?: HydrationStrategy;
}

export interface IslandClientEntry {
  id: string;
  tagName: string;
  modulePath: string;
  exportName?: string;
  hydrate: HydrationStrategy;
}

export interface IslandManifest {
  entries: IslandClientEntry[];
}
