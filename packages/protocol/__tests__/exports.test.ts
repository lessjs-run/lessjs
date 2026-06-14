import { assertEquals } from 'jsr:@std/assert@1';
import * as protocols from '../src/index.ts';

Deno.test('@openelement/protocol exports runtime validators and type-only contracts', () => {
  assertEquals(Object.keys(protocols).sort(), [
    'MemoryDataAdapter',
    'V040_ISLAND_FRAMEWORK_PLAN',
    'assertIslandFrameworkAllowed',
    'createPluginMeta',
    'createRuntimeAdapter',
    'getIslandFrameworkPlan',
    'isOpenBlogOptions',
    'isOpenBuildContextLike',
    'isOpenHeaderNavLink',
    'isOpenI18nOptions',
    'isOpenNavSection',
    'isOpenPluginMeta',
    'isSignalLike',
    'normalizeLocalePath',
    'runCacheAdapterConformance',
    'runComponentAdapterConformance',
    'runDataAdapterConformance',
    'runRendererConformance',
    'runRuntimeAdapterConformance',
    'runSignalEngineConformance',
    'unwrapSignalLike',
  ]);
});
