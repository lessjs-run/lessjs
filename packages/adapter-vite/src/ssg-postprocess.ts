/**
 * Compatibility re-exports for the SSG post-processing helpers.
 *
 * The implementation lives in @openelement/ssg as of v0.36.2.
 */
export {
  buildIslandChunkMap,
  buildSpeculationRulesJson,
  injectClientScript,
  injectCspMeta,
  injectDsdPolyfill,
  injectSpeculationRules,
  injectViewTransitionMeta,
  insertAfterHead,
} from '@openelement/ssg';
export type { SpeculationRulesOptions } from '@openelement/ssg';
