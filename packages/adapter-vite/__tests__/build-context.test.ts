/**
 * @lessjs/adapter-vite - build-context.ts tests (Deno)
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { LessBuildContext } from '../src/build-context.ts';

Deno.test('LessBuildContext creates instance without error', () => {
  const ctx = new LessBuildContext({});
  assertExists(ctx);
});

Deno.test('LessBuildContext has empty default mutable state', () => {
  const ctx = new LessBuildContext({});

  // Empty state
  assertEquals(ctx.phase1.honoEntryCode, '');
  assertEquals(ctx.phase1.islandTagNames.length, 0);
  assertEquals(ctx.phase1.packageManifests.length, 0);
  assertEquals(ctx.phase1.packageIslandDecls.length, 0);
  assertEquals(ctx.phase1.buildCompleted, false);
  assertEquals(ctx.phase1.resolvedConfig, null);
  assertEquals(ctx.phase1.userResolveAlias, null);
});

Deno.test('LessBuildContext reset clears all mutable state', () => {
  const ctx = new LessBuildContext({});

  // Mutate
  ctx.phase1.honoEntryCode = 'test code';
  ctx.phase1.islandTagNames = ['a', 'b'];
  ctx.phase1.packageIslandDecls = [{ tagName: 'x', modulePath: './x', hydrate: 'idle' }];
  ctx.phase1.buildCompleted = true;
  ctx.phase1.resolvedConfig = {} as unknown as NonNullable<typeof ctx.phase1.resolvedConfig>;
  ctx.phase1.userResolveAlias = { '@lessjs/ui': './ui' };

  ctx.reset();

  assertEquals(ctx.phase1.honoEntryCode, '');
  assertEquals(ctx.phase1.islandTagNames.length, 0);
  assertEquals(ctx.phase1.packageManifests.length, 0);
  assertEquals(ctx.phase1.packageIslandDecls.length, 0);
  assertEquals(ctx.phase1.buildCompleted, false);
  assertEquals(ctx.phase1.resolvedConfig, null);
  // NOTE: userResolveAlias is intentionally NOT reset - it's user configuration,
  // not build state (see build-context.ts:138-140). It persists through reset()
  // so Phase 2/3 can still access resolve aliases after buildStart() calls reset().
  assertEquals(ctx.phase1.userResolveAlias, { '@lessjs/ui': './ui' });
});
