/**
 * @lessjs/core - build-context.ts tests (Deno)
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
  assertEquals(ctx.honoEntryCode, '');
  assertEquals(ctx.islandTagNames.length, 0);
  assertEquals(ctx.packageIslands.length, 0);
  assertEquals(ctx.buildCompleted, false);
  assertEquals(ctx.resolvedConfig, null);
  assertEquals(ctx.userResolveAlias, null);
});

Deno.test('LessBuildContext reset clears all mutable state', () => {
  const ctx = new LessBuildContext({});

  // Mutate
  ctx.honoEntryCode = 'test code';
  ctx.islandTagNames = ['a', 'b'];
  ctx.packageIslands = [{ tagName: 'x', modulePath: './x', strategy: 'lazy' }];
  ctx.buildCompleted = true;
  ctx.resolvedConfig = {} as unknown as NonNullable<typeof ctx.resolvedConfig>;
  ctx.userResolveAlias = { '@lessjs/ui': './ui' };

  ctx.reset();

  assertEquals(ctx.honoEntryCode, '');
  assertEquals(ctx.islandTagNames.length, 0);
  assertEquals(ctx.packageIslands.length, 0);
  assertEquals(ctx.buildCompleted, false);
  assertEquals(ctx.resolvedConfig, null);
  // NOTE: userResolveAlias is intentionally NOT reset — it's user configuration,
  // not build state (see build-context.ts:138-140). It persists through reset()
  // so Phase 2/3 can still access resolve aliases after buildStart() calls reset().
  assertEquals(ctx.userResolveAlias, { '@lessjs/ui': './ui' });
});
