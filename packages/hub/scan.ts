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

console.log(`\n  🔍 Scanning installed Web Component packages...\n`);

const result = await scanInstalledPackages();

console.log(`  Found ${result.records.length} package(s)`);
console.log(`  Index: ${result.index.packages.length} entry(ies)\n`);

// Write to hub-index/ (source of truth, git-tracked)
console.log(`  Writing to hub-index/...`);
await writeScanOutput(RESULT_DIR, result);

// Write to www/public/hub/ (Vite serves public/ at root)
console.log(`\n  Writing to www/public/hub/...`);
await writeScanOutput(PUBLIC_DIR, result);

// Write TypeScript module for SSR import (route modules can import this directly)
console.log(`\n  Writing www/app/data/registry/hub-index.ts...`);
await writeIndexTs(result, `${Deno.cwd()}/www/app/data/registry/hub-index.ts`);

// Write TypeScript module with full package records for detail page SSR
console.log(`  Writing www/app/routes/registry/_hub-data-full.ts...`);
await writePackageDataTs(result, `${Deno.cwd()}/www/app/routes/registry/_hub-data-full.ts`);

console.log(`\n  ✅ Done!`);
