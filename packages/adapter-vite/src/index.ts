/**
 * @lessjs/adapter-vite - Vite build orchestration adapter.
 *
 * Provides the `less()` Vite plugin that handles:
 * - Route scanning and virtual Hono entry generation
 * - Dev server integration via @hono/vite-dev-server
 * - Island marking transform
 * - SSG build pipeline (Phase 1/2/3)
 * - Core subpath resolution (ADR 0016)
 *
 * Runtime code (renderDsd, defineIsland, escapeHtml, etc.) lives in @lessjs/core.
 * This package only contains Vite-specific build orchestration.
 *
 * For the unified lessjs() entry, use @lessjs/app instead.
 *
 * v0.22 (SOP-004): Decomposed into 5 focused modules:
 *   head-injection.ts      — HTML fragment validation & serialization
 *   less-plugin.ts         — less() plugin factory
 *   subpath-resolver.ts    — JSR remote resolution (ADR 0016)
 *   optional-package-stubs.ts — No-op stubs for optional adapters
 *   phase-context.ts       — Sub-plugin dispatch layer
 *
 * This file is now a pure re-export hub (~60 lines).
 */

// ─── Primary public API ──────────────────────────────────────────
export { less } from './less-plugin.js';
export { lessPipeline, type PipelineConfig } from './build-pipeline.js';

// ─── Build context ───────────────────────────────────────────────
export { LessBuildContext } from './build-context.js';

// ─── Build manifest ──────────────────────────────────────────────
export type { ArtifactInfo, BuildManifest } from './build-manifest.js';
export { printBuildManifest, scanClientBuild, scanSSGOutput } from './build-manifest.js';

// ─── SSG post-processing ─────────────────────────────────────────
export {
  buildIslandChunkMap,
  buildSpeculationRulesJson,
  injectClientScript,
  injectCspMeta,
  injectDsdPolyfill,
  injectSpeculationRules,
  injectViewTransitionMeta,
  insertAfterHead,
  type SpeculationRulesOptions,
} from './ssg-postprocess.js';

// ─── Island manifests ────────────────────────────────────────────
export {
  extractCustomElementTags,
  generateIslandManifests,
  type IslandLayerMap,
  type IslandManifestEntry,
  type IslandStrategyMap,
  type PageIslandManifest,
  writeIslandManifests,
} from './island-manifest.js';

// ─── External resolver types ─────────────────────────────────────
export type { ExternalManifest } from './external-resolver.js';

// ─── Subpath resolver (public constants) ─────────────────────────
export { CORE_SUBPATHS, VIRTUAL_CORE_PREFIX } from './subpath-resolver.js';

// ─── Head injection (public helpers) ─────────────────────────────
export { assertNoScriptTags, buildHeadExtras, validateSafeUrl } from './head-injection.js';
export type { HeadExtrasResult } from './head-injection.js';

// ─── Optional package stubs ──────────────────────────────────────
export { OPTIONAL_PACKAGE_STUBS } from './optional-package-stubs.js';

// ─── Default export ──────────────────────────────────────────────
export { less as default } from './less-plugin.js';
