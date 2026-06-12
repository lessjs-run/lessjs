import { assertEquals } from 'jsr:@std/assert@1';
import * as protocols from '../src/index.ts';

Deno.test('@openelement/protocols exports runtime validators and type-only contracts', () => {
  assertEquals(Object.keys(protocols).sort(), [
    'MemoryDataAdapter',
    'createPluginMeta',
    'createRuntimeAdapter',
    'isOpenBlogOptions',
    'isOpenBuildContextLike',
    'isOpenHeaderNavLink',
    'isOpenI18nOptions',
    'isOpenNavSection',
    'isOpenPluginMeta',
    'isSignalLike',
    'runCacheAdapterConformance',
    'runComponentAdapterConformance',
    'runDataAdapterConformance',
    'runRendererConformance',
    'runRuntimeAdapterConformance',
    'runSignalEngineConformance',
    'unwrapSignalLike',
  ]);
});
