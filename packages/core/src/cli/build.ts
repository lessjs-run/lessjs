/**
 * @lessjs/core - CLI: Full Static Build
 *
 * Official one-command build pipeline for LessJS apps.
 *
 * Three build phases, single process, shared LessBuildContext:
 *   Phase 1: Vite build writes the server bundle + ctx metadata
 *   Phase 2: Client island build writes dist/client/islands
 *   Phase 3: SSG builds self-contained SSR bundle (viteBuild ssr:noExternal),
 *            imports it, renders static HTML, and post-processes the output
 *
 * ADR 0010: No .less/ temp files. All metadata flows through ctx.
 *
 * Usage:
 *   deno run -A jsr:@lessjs/core/cli/build
 *   deno task build
 */

import { build as viteBuild } from 'vite';
import process from 'node:process';
import { LessBuildContext } from '../build-context.js';
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
  // Shared build context — replaces .less/ file IPC between phases
  // ADR 0010: ctx is required for all phases, no fallback to filesystem
  const ctx = new LessBuildContext({});

  await runPhase({
    name: 'Phase 1/3 - Vite SSR build',
    run: () => viteBuild(),
  });
  await runPhase({
    name: 'Phase 2/3 - client island build',
    run: () => buildClient(ctx),
  });
  await runPhase({
    name: 'Phase 3/3 - static site generation',
    run: () => buildSSG({}, ctx),
  });
  log.info('Build complete.');
}

if (import.meta.main) {
  build().catch((error) => {
    log.error('Build failed:', error);
    process.exit(1);
  });
}
