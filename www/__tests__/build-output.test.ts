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

Deno.test('build output: client island JS stays within core and showcase budgets', () => {
  assert(existsSync(DIST), `Build output is missing: ${DIST}`);
  const clientDir = join(DIST, 'client');
  assert(existsSync(clientDir), `Client output directory is missing: ${clientDir}`);

  const showcaseChunks = [
    'island-media-chrome-showcase',
    'island-react-showcase',
  ];
  const files = readdirSync(clientDir, { recursive: true }) as string[];
  let coreBytes = 0;
  let showcaseBytes = 0;
  for (const f of files) {
    if (f.endsWith('.js')) {
      const stat = statSync(join(clientDir, f));
      if (showcaseChunks.some((prefix) => f.includes(prefix))) {
        showcaseBytes += stat.size;
      } else {
        coreBytes += stat.size;
      }
    }
  }
  const coreKB = coreBytes / 1024;
  const showcaseKB = showcaseBytes / 1024;
  assert(
    coreKB < 700,
    `Core client island JS total ${coreKB.toFixed(1)}KB exceeds 700KB limit`,
  );
  assert(
    showcaseKB < 320,
    `Showcase island JS total ${showcaseKB.toFixed(1)}KB exceeds 320KB limit`,
  );
});
