/**
 * @lessjs/core - CLI: Full Static Build
 *
 * Official one-command build pipeline for LessJS apps.
 *
 * Internally this keeps the three build phases separate and observable:
 *   Phase 1: Vite build writes the server bundle + .less metadata
 *   Phase 2: Client island build writes dist/client/islands
 *   Phase 3: SSG builds self-contained SSR bundle (viteBuild ssr:noExternal),
 *            imports it, renders static HTML, and post-processes the output
 *
 * Usage:
 *   deno run -A jsr:@lessjs/core/cli/build
 *   deno task build
 */

import { build as viteBuild } from 'vite';
import process from 'node:process';
import { buildClient } from './build-client.js';
import { buildSSG } from './build-ssg.js';
import { createLogger } from '../logger.js';

const log = createLogger('ssg');

type BuildPhase = {
  name: string;
  run: () => Promise<unknown>;
};

async function runPhase(phase: BuildPhase): Promise<void> {
  log.info(`${phase.name}...`);
  try {
    await phase.run();
  } catch (error) {
    log.error(`${phase.name} failed.`);
    throw error;
  }
}

export async function build(): Promise<void> {
  await runPhase({
    name: 'Phase 1/3 - Vite SSR build',
    run: () => viteBuild(),
  });
  await runPhase({
    name: 'Phase 2/3 - client island build',
    run: () => buildClient(),
  });
  await runPhase({
    name: 'Phase 3/3 - static site generation',
    run: () => buildSSG(),
  });
  log.info('Build complete.');
}

if (import.meta.main) {
  build().catch((error) => {
    log.error('Build failed:', error);
    process.exit(1);
  });
}
