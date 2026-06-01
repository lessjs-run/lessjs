#!/usr/bin/env -S deno run --allow-read
/**
 * Hub Record Validator - validate hub-index records against schema.
 *
 * Usage:
 *   deno run -A packages/hub/src/cli/validate.ts
 *   deno run -A packages/hub/src/cli/validate.ts --json
 *   deno run -A packages/hub/src/cli/validate.ts --strict
 *
 * Checks:
 *   - Schema compliance for all package records
 *   - Manifest hash format (non-empty if present)
 *   - Duplicate tag names across all records (hard failure)
 *   - Snapshot artifact file existence
 *
 * Exit code 0 = all valid, 1 = errors found.
 */

import { validateHubPackageRecord } from '../schema.ts';
import type { HubPackageRecord } from '../schema.ts';

interface ValidateResult {
  total: number;
  passed: number;
  failed: number;
  errors: string[];
  warnings: string[];
  duplicateTags: string[];
}

function loadAllRecords(): HubPackageRecord[] {
  const cwd = Deno.cwd();
  // Try hub-index/packages/ first, then www/public/hub/packages/
  const dirs = [
    `${cwd}/hub-index/packages`,
    `${cwd}/www/public/hub/packages`,
    `${cwd}/public/hub/packages`,
  ];

  const records: HubPackageRecord[] = [];

  for (const dir of dirs) {
    try {
      const entries = Deno.readDirSync(dir);
      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`;
        if (entry.isDirectory) {
          // Scoped package directory: @scope/name.json inside subdirectory
          try {
            const subEntries = Deno.readDirSync(fullPath);
            for (const sub of subEntries) {
              if (!sub.name.endsWith('.json')) continue;
              records.push(
                JSON.parse(Deno.readTextFileSync(`${fullPath}/${sub.name}`)),
              );
            }
          } catch {
            // Not a directory or unreadable, skip
          }
        } else if (entry.name.endsWith('.json')) {
          // Unscoped package: name.json directly in packages/
          records.push(JSON.parse(Deno.readTextFileSync(fullPath)));
        }
      }
      break; // Found valid directory
    } catch {
      continue; // Try next directory
    }
  }

  return records;
}

function validateRecords(records: HubPackageRecord[], strict: boolean): ValidateResult {
  const result: ValidateResult = {
    total: records.length,
    passed: 0,
    failed: 0,
    errors: [],
    warnings: [],
    duplicateTags: [],
  };

  // Check duplicate tags across all records
  const allTags = new Map<string, string[]>();
  for (const record of records) {
    const fullName = record.scope ? `${record.scope}/${record.name}` : record.name;
    for (const tag of record.tags) {
      const owners = allTags.get(tag.tagName) || [];
      owners.push(fullName);
      allTags.set(tag.tagName, owners);
    }
  }
  for (const [tag, owners] of allTags) {
    if (owners.length > 1) {
      result.duplicateTags.push(`${tag} (${owners.join(', ')})`);
    }
  }

  // Validate each record
  for (const record of records) {
    const fullName = record.scope ? `${record.scope}/${record.name}` : record.name;

    const schemaErrors = validateHubPackageRecord(record);
    if (schemaErrors.length > 0) {
      result.failed++;
      for (const e of schemaErrors) {
        result.errors.push(`${fullName}: ${e.path}: ${e.message}`);
      }
      continue;
    }

    // Check manifest hash format
    if (!record.manifestHash || record.manifestHash === '') {
      result.warnings.push(
        `${fullName}: manifestHash is empty - CEM manifest integrity not verified`,
      );
    } else if (record.manifestHash.length !== 64) {
      result.warnings.push(
        `${fullName}: manifestHash has unexpected length (${record.manifestHash.length}, expected 64)`,
      );
    }

    // Check snapshot file existence
    for (const [tagName, snapPath] of Object.entries(record.snapshotPaths)) {
      try {
        const snapFullPath = `${Deno.cwd()}/${snapPath}`;
        Deno.statSync(snapFullPath);
      } catch {
        const errMsg = `${fullName}: snapshot "${snapPath}" for <${tagName}> not found`;
        if (strict) {
          result.errors.push(errMsg);
        } else {
          result.warnings.push(errMsg);
        }
      }
    }

    result.passed++;
  }

  // Duplicate tags are hard failures
  if (result.duplicateTags.length > 0) {
    for (const dup of result.duplicateTags) {
      result.errors.push(`Duplicate tag: ${dup}`);
    }
  }

  return result;
}

function printResult(result: ValidateResult, json: boolean) {
  if (json) {
    console.info(JSON.stringify(result, null, 2));
    Deno.exit(result.errors.length > 0 ? 1 : 0);
  }

  console.info(`\n  Hub Record Validator`);
  console.info(`  ${result.total} record(s), ${result.passed} passed, ${result.failed} failed\n`);

  if (result.errors.length > 0) {
    console.info(`  ❌ Errors (${result.errors.length}):`);
    for (const err of result.errors) {
      console.info(`     ${err}`);
    }
  }

  if (result.warnings.length > 0) {
    console.info(`  ⚠️  Warnings (${result.warnings.length}):`);
    for (const warn of result.warnings) {
      console.info(`     ${warn}`);
    }
  }

  if (result.duplicateTags.length > 0) {
    console.info(`  🔄 Duplicate tags:`);
    for (const dup of result.duplicateTags) {
      console.info(`     ${dup}`);
    }
  }

  if (result.errors.length === 0) {
    console.info(`  ✅ All records valid.\n`);
  } else {
    console.info(`\n`);
  }

  Deno.exit(result.errors.length > 0 ? 1 : 0);
}

function main() {
  const args = Deno.args;
  const json = args.includes('--json');
  const strict = args.includes('--strict');

  const records = loadAllRecords();
  const result = validateRecords(records, strict);
  printResult(result, json);
}

if (import.meta.main) {
  main();
}
