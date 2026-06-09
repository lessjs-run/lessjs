/**
 * autoflow:check — v0.35.0 Harness Gate CLI
 *
 * Reads governance documents, checks Pnueli temporal invariants,
 * and exits with 0 (pass) or 1 (fail).
 *
 * Usage:
 *   deno run --allow-read tools/autoflow/mod-check.ts
 *   deno run --allow-read tools/autoflow/mod-check.ts --strict
 *   deno run --allow-read tools/autoflow/mod-check.ts --dev   (allow version drift during development)
 */
import { checkAllInvariants, INVARIANTS } from './invariant-checker.ts';
import { EvidenceLedger } from './evidence-ledger.ts';
import { readStatus } from './readers/status.ts';
import { readPackageGraph } from './readers/package-graph.ts';

async function main(): Promise<void> {
  const strict = Deno.args.includes('--strict');
  const devMode = Deno.args.includes('--dev');
  const rootDir = Deno.cwd();
  const ledgerDir = `${rootDir}/docs/autoflow/cells`;

  // Read current project state
  const status = readStatus(rootDir);
  const version = status.currentVersion || 'unknown';
  const packageGraph = readPackageGraph(rootDir, version);

  // Build package version list
  const packageVersions = packageGraph.packages.map((p) => p.version);

  // Check invariants
  let ledger: EvidenceLedger | null = null;
  try {
    ledger = new EvidenceLedger(ledgerDir);
  } catch {
    // Ledger may not exist yet — that's OK for project-level checks
  }

  const report = await checkAllInvariants(ledger, {
    statusVersion: version,
    packageVersions,
    rootDir,
  }, { strict, devMode });

  // Output
  const errors = report.violations.filter((v) => v.severity === 'error');
  const warnings = report.violations.filter((v) => v.severity === 'warning');

  if (report.passed) {
    console.log(`✅ autoflow:check passed`);
    if (warnings.length > 0) {
      console.log(`   ${warnings.length} warning(s):`);
      for (const w of warnings) {
        console.log(`   ⚠️  [${w.invariantId}] ${w.description}`);
      }
    }
    console.log(`   ${INVARIANTS.length} invariants checked`);
    Deno.exit(0);
  } else {
    console.error(`❌ autoflow:check failed: ${errors.length} error(s)`);
    for (const e of errors) {
      console.error(`   ❌ [${e.invariantId}] ${e.description}`);
    }
    if (warnings.length > 0 && !strict) {
      console.error(`   ${warnings.length} warning(s) (use --strict to escalate)`);
    }
    Deno.exit(1);
  }
}

await main();
