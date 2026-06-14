/**
 * @openelement/ssg - Entry descriptor smoke tests.
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { buildEntryDescriptor } from '@openelement/ssg';

Deno.test('buildEntryDescriptor produces a valid descriptor', () => {
  const descriptor = buildEntryDescriptor([
    { type: 'page', path: '/', filePath: 'index.ts', varName: 'index', tagName: 'index-page' },
    { type: 'page', path: '/about', filePath: 'about.ts', varName: 'about', tagName: 'about-page' },
  ]);

  assertEquals(descriptor.isSSG, false);
  assertEquals(descriptor.pageRoutes.length, 2);
  assertEquals(descriptor.pageRoutes[0].path, '/');
  assertEquals(descriptor.pageRoutes[1].path, '/about');
  assertEquals(descriptor.apiRoutes.length, 0);
  assertEquals(descriptor.ssrAdmissionPlan.renderableTags.length, 0);
});

Deno.test('buildEntryDescriptor marks SSG when requested', () => {
  const descriptor = buildEntryDescriptor([], { ssg: true });
  assertEquals(descriptor.isSSG, true);
});
