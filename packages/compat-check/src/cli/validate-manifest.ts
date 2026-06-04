#!/usr/bin/env -S deno run --allow-read
/**
 * @openelement/validate-manifest - CLI for validating CEM manifests.
 *
 * Usage:
 *   deno run -A jsr:@openelement/core/validate-manifest ./custom-elements.json
 *   deno run -A jsr:@openelement/core/validate-manifest ./custom-elements.json --json
 *   deno run -A jsr:@openelement/core/validate-manifest ./custom-elements.json --strict
 *
 * Exit codes:
 *   0 - manifest is valid
 *   1 - manifest has errors
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateManifestFromJson } from '../validate-manifest.ts';

// ─── CLI Entry Point ──────────────────────────────────────────────────

async function main() {
  const args = Deno.args;
  const flags = {
    json: args.includes('--json'),
    strict: args.includes('--strict'),
  };

  // Filter out flags to get the file path
  const fileArg = args.find((a) => !a.startsWith('--'));
  if (!fileArg) {
    console.error('Usage: validate-manifest <path-to-custom-elements.json> [--json] [--strict]');
    Deno.exit(1);
  }

  const filePath = resolve(fileArg);

  let json: string;
  try {
    const buf = await readFile(filePath);
    json = new TextDecoder().decode(buf);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error reading file "${filePath}": ${msg}`);
    Deno.exit(1);
  }

  const report = validateManifestFromJson(json);

  // ─── Output ────────────────────────────────────────────────────────

  if (flags.json) {
    console.info(JSON.stringify(report, null, 2));
  } else {
    // Human-readable output
    const pkgInfo = report.packageName
      ? `${report.packageName}${report.version ? ` v${report.version}` : ''}`
      : 'unknown package';
    console.info(`\n  Manifest: ${pkgInfo}`);
    console.info(`  Schema:   ${report.schemaVersion || 'unknown'}`);
    console.info(`  Valid:    ${report.valid ? '✅ yes' : '❌ no'}`);
    console.info(`  Tier:     ${report.compatibility}`);
    console.info(`  Tags:     ${report.tags.length}`);

    if (report.errors.length > 0) {
      console.info(`\n  Errors (${report.errors.length}):`);
      for (const err of report.errors) {
        const tag = err.tagName ? ` [${err.tagName}]` : '';
        console.info(`    ❌ ${err.code}${tag}: ${err.message}`);
        if (err.fix) console.info(`       Fix: ${err.fix}`);
      }
    }

    if (report.warnings.length > 0) {
      console.info(`\n  Warnings (${report.warnings.length}):`);
      for (const warn of report.warnings) {
        const tag = warn.tagName ? ` [${warn.tagName}]` : '';
        console.info(`    ⚠️  ${warn.code}${tag}: ${warn.message}`);
        if (warn.fix) console.info(`       Fix: ${warn.fix}`);
      }
    }

    if (report.tags.length > 0) {
      console.info(`\n  Components:`);
      for (const tag of report.tags) {
        const status = tag.valid ? '✅' : '❌';
        const ssr = tag.ssr !== undefined ? ` ssr=${tag.ssr}` : '';
        const dsd = tag.dsd !== undefined ? ` dsd=${tag.dsd}` : '';
        console.info(`    ${status} <${tag.tagName}> - ${tag.compatibility}${ssr}${dsd}`);
      }
    }

    console.info();
  }

  // Strict mode: fail on warnings too
  if (flags.strict && report.warnings.length > 0) {
    Deno.exit(1);
  }

  Deno.exit(report.valid ? 0 : 1);
}

if (import.meta.main) {
  main();
}
