/**
 * @lessjs/adapter-vite - CLI: Full Static Build
 *
 * ADR 0011: One-command build entry. viteBuild() triggers Phase 1,
 * and closeBundle() in less:build plugin automatically runs Phase 2/3.
 * No orchestrator needed — all three phases run in a single viteBuild() call.
 *
 * Usage:
 *   deno run -A jsr:@lessjs/adapter-vite/cli/build
 *   deno task build
 */

import { build as viteBuild } from 'vite';
import process from 'node:process';

if (import.meta.main) {
  try {
    await viteBuild({ configLoader: 'native' });
    process.exit(0);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}
