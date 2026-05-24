#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run
/**
 * @lessjs/hub-submit - CLI for submitting packages to the Registry Hub.
 *
 * Usage:
 *   deno run -A jsr:@lessjs/hub/cli/hub-submit [options]
 *   deno run -A jsr:@lessjs/hub/cli/hub-submit --dir ./my-package
 *   deno run -A jsr:@lessjs/hub/cli/hub-submit --dry-run
 *
 * Options:
 *   --dir <path>      Package directory (default: cwd)
 *   --source <type>   Package source: jsr | npm | local (default: local)
 *   --dry-run         Only validate, do not create PR (default: true)
 *   --no-pr           Skip GitHub PR, output submission bundle only
 *   --out <path>      Output path (default: ./hub-submission.json)
 *   --json            Output as JSON (default: human-readable)
 *   --verbose         Verbose output
 *   -h, --help        Show help
 *
 * Exit codes:
 *   0 - Submission ready
 *   1 - Validation failed
 *   2 - Build failed
 *   3 - Submission bundle invalid
 *
 * @see ADR-0030
 */

import { buildPackageRecord } from '../builder.ts';
import { runSubmission } from '../submitter.ts';
import { validateHubPackageRecord } from '../schema.ts';
import type {
  BuildPackageRecordOptions,
  CompatibilityTier,
  HubTagRecord,
  SubmissionOptions,
  SubmissionResult,
} from '../schema.ts';

// ─── CLI Entry ───────────────────────────────────────────────────────────

interface CliFlags {
  dir: string;
  source: 'jsr' | 'npm' | 'local';
  dryRun: boolean;
  skipPr: boolean;
  outputPath: string;
  json: boolean;
  verbose: boolean;
  help: boolean;
}

function parseArgs(args: string[]): CliFlags {
  const flags: CliFlags = {
    dir: Deno.cwd(),
    source: 'local',
    dryRun: true,
    skipPr: false,
    outputPath: './hub-submission.json',
    json: false,
    verbose: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dir':
        flags.dir = args[++i] || flags.dir;
        break;
      case '--source':
        flags.source = (args[++i] || 'local') as 'jsr' | 'npm' | 'local';
        break;
      case '--submit':
        flags.dryRun = false;
        flags.skipPr = false;
        break;
      case '--dry-run':
        flags.dryRun = true;
        break;
      case '--no-pr':
        flags.skipPr = true;
        break;
      case '--out':
        flags.outputPath = args[++i] || flags.outputPath;
        break;
      case '--json':
        flags.json = true;
        break;
      case '--verbose':
        flags.verbose = true;
        break;
      case '-h':
      case '--help':
        flags.help = true;
        break;
    }
  }

  return flags;
}

function printHelp() {
  console.log(`
less hub submit - Submit a package to the LessJS Registry Hub

USAGE:
  less hub submit [options]

OPTIONS:
  --dir <path>      Package directory (default: cwd)
  --source <type>   Package source: jsr | npm | local (default: local)
  --submit          Actually submit: run validation, bundle, create PR (default: dry-run only)
  --dry-run         Only validate, do not create PR (default: true)
  --no-pr           Skip GitHub PR, output submission bundle only
  --no-pr           Skip GitHub PR, output submission bundle only
  --out <path>      Output path (default: ./hub-submission.json)
  --json            Output as JSON (default: human-readable)
  --verbose         Verbose output
  -h, --help        Show help

EXIT CODES:
  0  Submission ready
  1  Validation failed
  2  Build failed
  3  Submission bundle invalid

EXAMPLES:
  less hub submit --dry-run
  less hub submit --dir ./my-package --source npm
  less hub submit --no-pr --out ./bundle.json
`);
}

async function main() {
  const flags = parseArgs(Deno.args);

  if (flags.help) {
    printHelp();
    Deno.exit(0);
  }

  if (flags.verbose) {
    console.error(`  Hub submission from: ${flags.dir}`);
    console.error(`  Source: ${flags.source}`);
    console.error(`  Mode: ${flags.dryRun ? 'dry-run' : flags.skipPr ? 'local bundle' : 'PR'}`);
  }

  // ─── Step 1: Detect package info ──────────────────────────────────────
  // Read package.json or deno.json for basic metadata

  let packageName = '';
  let packageVersion = '';
  let packageScope = '';
  let description = '';
  let repository = '';

  try {
    // Try deno.json first
    const denoJsonPath = `${flags.dir}/deno.json`;
    const denoJsonContent = await Deno.readTextFile(denoJsonPath);
    const denoJson = JSON.parse(denoJsonContent);
    packageName = denoJson.name || '';
    packageVersion = denoJson.version || '0.0.0';
    if (packageName.includes('/')) {
      const parts = packageName.split('/');
      packageScope = parts[0];
      packageName = parts[1];
    }
  } catch {
    // Try package.json
    try {
      const pkgJsonPath = `${flags.dir}/package.json`;
      const pkgJsonContent = await Deno.readTextFile(pkgJsonPath);
      const pkgJson = JSON.parse(pkgJsonContent);
      packageName = pkgJson.name || '';
      packageVersion = pkgJson.version || '0.0.0';
      description = pkgJson.description || '';
      repository = pkgJson.repository?.url || pkgJson.repository || '';
      if (packageName.includes('/')) {
        const parts = packageName.split('/');
        packageScope = parts[0];
        packageName = parts[1];
      }
    } catch {
      console.error('❌ Could not read package metadata. Ensure deno.json or package.json exists.');
      Deno.exit(1);
    }
  }

  if (!packageName) {
    console.error('❌ Package name not found in deno.json or package.json.');
    Deno.exit(1);
  }

  const fullName = packageScope ? `${packageScope}/${packageName}` : packageName;

  if (!flags.json) {
    console.log(`\n  📦 Package: ${fullName} v${packageVersion}`);
  }

  // ─── Step 2: Validate manifest ───────────────────────────────────────
  // Try to find and validate custom-elements.json

  const cemPaths = [
    `${flags.dir}/custom-elements.json`,
    `${flags.dir}/dist/custom-elements.json`,
    `${flags.dir}/node_modules/${fullName}/custom-elements.json`,
  ];

  let cemContent: string | null = null;
  let cemPath: string | null = null;

  for (const p of cemPaths) {
    try {
      cemContent = await Deno.readTextFile(p);
      cemPath = p;
      break;
    } catch {
      // Not found at this path, try next
    }
  }

  if (!cemContent) {
    if (!flags.json) {
      console.log(`  ⚠️  No custom-elements.json found. Defaulting to unknown compatibility.`);
    }
  }

  // ─── Step 3: Detect compatibility from CEM ────────────────────────────
  // For now: attempt basic CEM parsing; if no CEM, default to client-only

  const tags: HubTagRecord[] = [];
  let compatibility: CompatibilityTier = 'client-only';
  let compatibilityJustification = 'No CEM manifest found; default client-only.';

  if (cemContent) {
    try {
      const cem = JSON.parse(cemContent);
      const modules = cem.modules || [];
      const cemTags: string[] = [];

      for (const mod of modules) {
        if (mod.declarations) {
          for (const decl of mod.declarations) {
            if (decl.tagName) {
              cemTags.push(decl.tagName);
              tags.push({
                tagName: decl.tagName,
                compatibility: 'client-only',
                validationErrors: 0,
                validationWarnings: 0,
              });
            }
          }
        }
      }

      if (cemTags.length > 0) {
        compatibility = 'client-only';
        compatibilityJustification =
          `${cemTags.length} tag(s) found in CEM. No LessJS SSR metadata; default client-only.`;
      }

      if (flags.verbose) {
        console.error(`  CEM found: ${cemPath}`);
        console.error(`  Tags: ${cemTags.length}`);
      }
    } catch {
      // Invalid CEM JSON
      compatibility = 'rejected';
      compatibilityJustification = 'custom-elements.json is not valid JSON.';
    }
  }

  // ─── Step 4: Build HubPackageRecord ───────────────────────────────────

  const recordOptions: BuildPackageRecordOptions = {
    name: packageName,
    scope: packageScope,
    version: packageVersion,
    source: flags.source,
    compatibility,
    compatibilityJustification,
    tags,
    validationReport: JSON.stringify({
      packageName: fullName,
      version: packageVersion,
      valid: compatibility !== 'rejected',
      compatibility,
      tags: tags.length,
      errors: [],
      warnings: [],
    }),
    repository: repository || undefined,
    description: description || undefined,
    validatorVersion: '0.19.0',
    manifestContent: cemContent || undefined,
  };

  const record = await buildPackageRecord(recordOptions);

  // ─── Step 5: Validate the record ──────────────────────────────────────

  const schemaErrors = validateHubPackageRecord(record);
  if (schemaErrors.length > 0) {
    if (!flags.json) {
      console.error(`\n  ❌ Schema validation failed:`);
      for (const e of schemaErrors) {
        console.error(`     ${e.path}: ${e.message}`);
      }
    }
    Deno.exit(3);
  }

  // ─── Step 6: Run submission ───────────────────────────────────────────

  const submissionOptions: SubmissionOptions = {
    packageDir: flags.dir,
    source: flags.source,
    dryRun: flags.dryRun,
    skipPr: flags.skipPr,
    outputPath: flags.outputPath,
    verbose: flags.verbose,
  };

  // Collect artifacts (snapshots, etc.)
  const artifacts: import('../schema.ts').HubArtifact[] = [];
  if (cemContent) {
    artifacts.push({
      path: 'custom-elements.json',
      contentType: 'application/json',
      content: cemContent,
    });
  }

  if (!flags.json && !flags.dryRun) {
    console.log(`  Creating submission...`);
  }

  const result: SubmissionResult = await runSubmission(
    record,
    artifacts,
    submissionOptions,
  );

  // ─── Step 7: Output result ────────────────────────────────────────────

  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.success) {
      console.log(`\n  ✅ Submission ready`);
      if (result.prUrl) {
        console.log(`  PR: ${result.prUrl}`);
      }
      console.log(`  Output: ${result.bundlePath}`);
    } else {
      console.log(`\n  ❌ Submission failed`);
      for (const e of result.errors) {
        console.log(`     ${e}`);
      }
    }

    if (result.warnings.length > 0) {
      console.log(`\n  ⚠️  Warnings:`);
      for (const w of result.warnings) {
        console.log(`     ${w}`);
      }
    }

    console.log();
  }

  Deno.exit(result.success ? 0 : 1);
}

if (import.meta.main) {
  main();
}
