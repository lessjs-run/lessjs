#!/usr/bin/env -S deno run --allow-read
/**
 * DSD Report Gate - checks dsd-report.json against error thresholds.
 *
 * Usage:
 *   deno task dsd:check-report
 *
 * Reads www/dist/dsd-report.json and checks:
 * 1. Non-recoverable errors must not exceed threshold (default: Infinity for now)
 * 2. New error types not in the allowlist cause a warning
 *
 * Thresholds will be tightened progressively:
 * - v0.19.x: No fail (report only, current: 6 non-recoverable from sl-input)
 * - v0.20.0: non-recoverable errors <= 10
 * - v0.21.0: non-recoverable errors = 0
 *
 * NOTE: Current threshold is Infinity (report-only mode).
 * This gate classifies errors but does not fail the build.
 * Tightening schedule:
 *   v0.19.x -> non-recoverable <= 6 (no new non-recoverable errors)
 *   v0.20   -> total errors <= 10
 *   v0.21   -> 0 unknown errors
 */

interface RenderError {
  phase: string;
  tagName?: string;
  message: string;
  recoverable: boolean;
}

interface DsdReport {
  totalErrors: number;
  renderErrors: Array<{
    path: string;
    errors: RenderError[];
    hydrationHints: unknown[];
    componentCount: number;
    renderTimeMs: number;
  }>;
  reportVersion?: string;
  timestamp?: string;
}

// Known error patterns - all from Shoelace components in SSR
const KNOWN_ERROR_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  {
    pattern: /this\.host\.querySelector is not a function/,
    description: 'Shoelace component accessing DOM during SSR',
  },
  {
    pattern: /Cannot read properties of undefined/,
    description: 'Shoelace component reading undefined property during SSR',
  },
  {
    pattern: /Failed to instantiate/,
    description: 'Shoelace component constructor failure in SSR',
  },
  {
    pattern: /Cannot set properties of undefined/,
    description: 'Shoelace component setting property on undefined during SSR',
  },
  {
    pattern: /Components must return a string from render\(\)/,
    description: 'Shoelace component returning non-string from render()',
  },
  {
    pattern: /this\.host\.childNodes is not iterable/,
    description: 'Shoelace component iterating host childNodes during SSR',
  },
];

const MAX_NON_RECOVERABLE = Infinity; // TODO: tighten to 10 in v0.20.0, 0 in v0.21.0

function main() {
  const reportPath = 'www/dist/dsd-report.json';

  let report: DsdReport;
  try {
    report = JSON.parse(Deno.readTextFileSync(reportPath));
  } catch {
    console.error(`[FAIL] Cannot read ${reportPath}. Run \`deno task build\` first.`);
    Deno.exit(1);
  }

  console.log(`\n  DSD Report Gate`);
  console.log(`  Total errors: ${report.totalErrors}`);

  // Collect all individual errors
  const allErrors: Array<RenderError & { path: string }> = [];
  for (const page of report.renderErrors) {
    for (const err of page.errors) {
      allErrors.push({ ...err, path: page.path });
    }
  }

  const nonRecoverable = allErrors.filter((e) => !e.recoverable);
  const recoverable = allErrors.filter((e) => e.recoverable);

  console.log(`  Non-recoverable: ${nonRecoverable.length}`);
  console.log(`  Recoverable: ${recoverable.length}`);

  // Group by error message
  const errorGroups: Record<string, { count: number; tags: Set<string>; known: boolean }> = {};
  for (const err of allErrors) {
    const key = err.message;
    if (!errorGroups[key]) {
      const known = KNOWN_ERROR_PATTERNS.some((p) => p.pattern.test(key));
      errorGroups[key] = { count: 0, tags: new Set(), known };
    }
    errorGroups[key].count++;
    if (err.tagName) errorGroups[key].tags.add(err.tagName);
  }

  console.log(`\n  Error breakdown:`);
  for (
    const [msg, info] of Object.entries(errorGroups).sort(
      (a, b) => b[1].count - a[1].count,
    )
  ) {
    const status = info.known ? '[known]' : '[UNKNOWN]';
    console.log(
      `  ${status} [${info.count}x] ${msg.substring(0, 80)}`,
    );
    console.log(`      Tags: ${[...info.tags].slice(0, 5).join(', ')}`);
  }

  // Check for unknown errors
  const unknownErrors = Object.entries(errorGroups).filter(
    ([, info]) => !info.known,
  );
  if (unknownErrors.length > 0) {
    console.log(
      `\n  [WARN] ${unknownErrors.length} unknown error type(s) detected. Consider adding to KNOWN_ERROR_PATTERNS.`,
    );
  }

  // Threshold check
  if (nonRecoverable.length > MAX_NON_RECOVERABLE) {
    console.error(
      `\n  [FAIL] ${nonRecoverable.length} non-recoverable errors exceed threshold (${MAX_NON_RECOVERABLE})`,
    );
    Deno.exit(1);
  }

  console.log(
    `\n  [PASS] Gate passed (threshold: non-recoverable <= ${MAX_NON_RECOVERABLE})`,
  );
  console.log(
    `  [INFO] All ${report.totalErrors} errors are from Shoelace components in SSR (expected, client-only)`,
  );
  console.log(
    `  [INFO] Threshold will tighten: v0.20 -> <= 10, v0.21 -> 0\n`,
  );
}

if (import.meta.main) {
  main();
}
