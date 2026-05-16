/**
 * Build output assertions — runs against www/dist after a production build.
 * These tests validate that build artifacts meet security and size constraints.
 *
 * Run: deno test www/__tests__/build-output.test.ts --allow-read
 * (must run after `deno task build`)
 */
// deno-lint-ignore no-unversioned-import
import { assert, assertEquals } from 'jsr:@std/assert';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dirname ?? '.', '..', 'dist');

Deno.test('build output: no Hono virtual entry in public assets', () => {
  assert(existsSync(DIST), `Build output is missing: ${DIST}`);
  const assetsDir = join(DIST, 'assets');
  assert(existsSync(assetsDir), `Build assets directory is missing: ${assetsDir}`);

  const files = readdirSync(assetsDir);
  const honoEntry = files.find((f) => f.startsWith('_virtual_less-hono-entry'));
  assertEquals(
    honoEntry,
    undefined,
    `Hono virtual entry should not be in dist/assets/: ${honoEntry}`,
  );
});

Deno.test('build output: client island JS total under 200KB', () => {
  assert(existsSync(DIST), `Build output is missing: ${DIST}`);
  const clientDir = join(DIST, 'client');
  assert(existsSync(clientDir), `Client output directory is missing: ${clientDir}`);

  const files = readdirSync(clientDir, { recursive: true }) as string[];
  let totalBytes = 0;
  for (const f of files) {
    if (f.endsWith('.js')) {
      const stat = statSync(join(clientDir, f));
      totalBytes += stat.size;
    }
  }
  const totalKB = totalBytes / 1024;
  assert(
    totalKB < 200,
    `Client island JS total ${totalKB.toFixed(1)}KB exceeds 200KB limit`,
  );
});
