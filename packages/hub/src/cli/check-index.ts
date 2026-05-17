#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Hub Index Checker — regenerates hub-index/index.json and checks for drift.
 *
 * Usage:
 *   deno task hub:check-index
 *
 * Reads all package records from hub-index/packages/, regenerates the
 * index, and compares it against the existing hub-index/index.json.
 * Exits with 1 if drift is detected, so CI can fail.
 */

import { buildIndex } from '../indexer.ts';
import type { HubPackageRecord } from '../schema.ts';

function loadRecords(baseDir: string): HubPackageRecord[] {
  const records: HubPackageRecord[] = [];
  const packagesDir = `${baseDir}/packages`;

  try {
    const entries = Deno.readDirSync(packagesDir);
    for (const entry of entries) {
      const fullPath = `${packagesDir}/${entry.name}`;
      if (entry.isDirectory) {
        // Scoped package: @scope/name.json inside subdirectory
        try {
          const subEntries = Deno.readDirSync(fullPath);
          for (const sub of subEntries) {
            if (!sub.name.endsWith('.json')) continue;
            records.push(
              JSON.parse(Deno.readTextFileSync(`${fullPath}/${sub.name}`)),
            );
          }
        } catch {
          // skip
        }
      } else if (entry.name.endsWith('.json')) {
        records.push(JSON.parse(Deno.readTextFileSync(fullPath)));
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return records;
}

function main() {
  const cwd = Deno.cwd();
  const baseDir = `${cwd}/hub-index`;
  const indexPath = `${baseDir}/index.json`;

  console.log(`\n  Hub Index Checker`);
  console.log(`  Base: ${baseDir}\n`);

  // Load records
  const records = loadRecords(baseDir);
  if (records.length === 0) {
    console.log(`  ⚠️  No package records found in ${baseDir}/packages/\n`);
    Deno.exit(0);
  }

  // Regenerate index
  const newIndex = buildIndex(records);
  const newIndexJson = JSON.stringify(newIndex, null, 2);

  // Compare with existing
  let needsUpdate = true;
  try {
    const existingIndex = Deno.readTextFileSync(indexPath);
    if (existingIndex === newIndexJson) {
      needsUpdate = false;
    }
  } catch {
    // File doesn't exist — needs update
  }

  if (needsUpdate) {
    Deno.writeTextFileSync(indexPath, newIndexJson);
    console.log(`  🔄 Index regenerated: ${records.length} package(s)\n`);
    Deno.exit(1); // Signal drift
  } else {
    console.log(`  ✅ Index is up to date (${records.length} package(s))\n`);
    Deno.exit(0);
  }
}

if (import.meta.main) {
  main();
}
