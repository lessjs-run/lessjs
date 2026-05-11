/**
 * @lessjs/core - CLI: Full Static Build
 *
 * ADR 0011: One-command build entry. viteBuild() triggers Phase 1,
 * and closeBundle() in less:build plugin automatically runs Phase 2/3.
 * No orchestrator needed — all three phases run in a single viteBuild() call.
 *
 * Usage:
 *   deno run -A jsr:@lessjs/core/cli/build
 *   deno task build
 */

import { build as viteBuild } from 'vite';
import process from 'node:process';

if (import.meta.main) {
  viteBuild().catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}
