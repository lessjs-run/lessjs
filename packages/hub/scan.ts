/**
 * Run the Hub scanner to generate real package records from installed modules.
 *
 * Usage: deno run -A packages/hub/scan.ts
 */

import {
  scanInstalledPackages,
  writeIndexTs,
  writePackageDataTs,
  writeScanOutput,
} from './src/scanner.ts';

const RESULT_DIR = `${Deno.cwd()}/hub-index`;
const PUBLIC_DIR = `${Deno.cwd()}/www/public/hub`;

console.info(`\n  🔍 Scanning installed Web Component packages...\n`);

const result = await scanInstalledPackages();

console.info(`  Found ${result.records.length} package(s)`);
console.info(`  Index: ${result.index.packages.length} entry(ies)\n`);

// Write to hub-index/ (source of truth, git-tracked)
console.info(`  Writing to hub-index/...`);
await writeScanOutput(RESULT_DIR, result);

// Write to www/public/hub/ (Vite serves public/ at root)
console.info(`\n  Writing to www/public/hub/...`);
await writeScanOutput(PUBLIC_DIR, result);

// Write TypeScript module for SSR import (route modules can import this directly)
console.info(`\n  Writing www/app/data/registry/hub-index.ts...`);
await writeIndexTs(result, `${Deno.cwd()}/www/app/data/registry/hub-index.ts`);

// Write TypeScript module with full package records for detail page SSR
console.info(`  Writing www/app/routes/registry/_hub-data-full.ts...`);
await writePackageDataTs(result, `${Deno.cwd()}/www/app/routes/registry/_hub-data-full.ts`);

console.info(`\n  ✅ Done!`);
