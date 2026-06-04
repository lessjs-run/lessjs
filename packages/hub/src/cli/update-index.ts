#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Hub Index Updater - regenerates and writes hub-index/index.json.
 *
 * Usage:
 *   deno task hub:index:update
 *
 * Reads all package records from hub-index/packages/, regenerates the
 * index, and writes it to hub-index/index.json if drift is detected.
 *
 * This is the write counterpart to `hub:check-index` (read-only).
 */

import { buildIndex } from '../indexer.ts';
import { loadHubPackageRecords } from './shared.ts';

function main() {
  const cwd = Deno.cwd();
  const baseDir = `${cwd}/hub-index`;
  const indexPath = `${baseDir}/index.json`;

  console.info(`\n  Hub Index Updater`);
  console.info(`  Base: ${baseDir}\n`);

  // Load records
  const records = loadHubPackageRecords(baseDir);
  if (records.length === 0) {
    console.info(`  ⚠️  No package records found in ${baseDir}/packages/\n`);
    Deno.exit(0);
  }

  // Regenerate index
  const newIndex = buildIndex(records);
  const newIndexJson = JSON.stringify(newIndex, null, 2);

  // Compare with existing - ignore updatedAt since it changes on every run
  let needsUpdate = true;
  try {
    const existingIndex = Deno.readTextFileSync(indexPath);
    const existingParsed = JSON.parse(existingIndex);
    const newParsed = JSON.parse(newIndexJson);
    existingParsed.updatedAt = '';
    newParsed.updatedAt = '';
    if (JSON.stringify(existingParsed) === JSON.stringify(newParsed)) {
      needsUpdate = false;
    }
  } catch {
    // File doesn't exist - needs update
  }

  if (needsUpdate) {
    Deno.writeTextFileSync(indexPath, newIndexJson);
    console.info(`  🔄 Index updated: ${records.length} package(s)\n`);
    Deno.exit(0);
  } else {
    console.info(`  ✅ Index already up to date (${records.length} package(s))\n`);
    Deno.exit(0);
  }
}

if (import.meta.main) {
  main();
}
