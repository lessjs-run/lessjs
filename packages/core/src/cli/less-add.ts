#!/usr/bin/env -S deno run --allow-read
/**
 * @lessjs/core/cli/less-add — CLI for adding Web Component packages.
 *
 * Usage:
 *   deno run -A jsr:@lessjs/core/cli/less-add @scope/package --dry-run
 *   deno run -A jsr:@lessjs/core/cli/less-add ./local/package/custom-elements.json
 *   deno run -A jsr:@lessjs/core/cli/less-add @scope/package --json
 *
 * Exit codes:
 *   0 — plan generated (valid)
 *   1 — plan failed (invalid package or error)
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generateAddPlan } from '../less-add.ts';

// ─── CLI Entry Point ──────────────────────────────────────────────────

async function main() {
  const args = Deno.args;
  const flags = {
    dryRun: args.includes('--dry-run'),
    json: args.includes('--json'),
  };

  const spec = args.find((a) => !a.startsWith('--'));
  if (!spec) {
    console.error('Usage: less-add <package-spec> [--dry-run] [--json]');
    console.error('  <package-spec> can be:');
    console.error('    @scope/package     — JSR/npm package');
    console.error('    ./custom-elements.json — local CEM file');
    Deno.exit(1);
  }

  // Resolve manifest JSON
  let manifestJson: string | undefined;

  // If it's a local file path, read it directly
  if (spec.startsWith('.') || spec.startsWith('/') || spec.includes('\\')) {
    const filePath = resolve(spec);
    try {
      const buf = await readFile(filePath);
      manifestJson = new TextDecoder().decode(buf);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error reading file "${filePath}": ${msg}`);
      Deno.exit(1);
    }
  } else {
    // For remote packages, we can't auto-download in this MVP.
    // Users provide the manifest or install first.
    manifestJson = undefined;
  }

  // Generate the plan
  const plan = generateAddPlan({
    spec,
    manifestJson,
    dryRun: flags.dryRun,
  });

  if (flags.json) {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    // Human-readable output
    const dryTag = flags.dryRun ? ' (dry run)' : '';
    console.log(
      `\n  less add${dryTag}: ${plan.packageName}${plan.version ? ` v${plan.version}` : ''}`,
    );
    console.log(`  ${'─'.repeat(50)}`);

    // Status updates
    for (const update of plan.statusUpdates) {
      console.log(`  ${update}`);
    }

    // Errors
    if (plan.errors.length > 0) {
      console.log(`\n  ❌ Errors (${plan.errors.length}):`);
      for (const err of plan.errors) {
        console.log(`    • ${err}`);
      }
    }

    // Warnings
    if (plan.warnings.length > 0) {
      console.log(`\n  ⚠️  Warnings (${plan.warnings.length}):`);
      for (const warn of plan.warnings) {
        console.log(`    • ${warn}`);
      }
    }

    // Tags
    if (plan.tags.length > 0) {
      console.log(`\n  📦 Tags (${plan.tags.length}):`);
      for (const tag of plan.tags) {
        const status = tag.valid ? '✅' : '❌';
        console.log(`    ${status} <${tag.tagName}> — ${tag.compatibility}`);
      }
    }

    // File mutations
    if (plan.fileMutations.length > 0) {
      console.log(`\n  📄 File mutations (${plan.fileMutations.length}):`);
      for (const mutation of plan.fileMutations) {
        const icon = mutation.type === 'add' ? '➕' : mutation.type === 'modify' ? '✏️' : '🗑️';
        console.log(`    ${icon} [${mutation.type}] ${mutation.filePath}`);
        console.log(`       ${mutation.description}`);
      }
    }

    console.log();
  }

  Deno.exit(plan.valid ? 0 : 1);
}

if (import.meta.main) {
  main();
}
