import { assertEquals } from 'jsr:@std/assert@1';
import * as protocols from '../src/index.ts';

Deno.test('@openelement/protocols exports runtime validators and type-only contracts', () => {
  assertEquals(Object.keys(protocols).sort(), [
    'createPluginMeta',
    'isLessBlogOptions',
    'isLessBuildContextLike',
    'isLessHeaderNavLink',
    'isLessI18nOptions',
    'isLessNavSection',
    'isLessPluginMeta',
  ]);
});
