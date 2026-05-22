#!/usr/bin/env -S deno run --allow-read --allow-env
/**
 * DSD Report Gate - checks dsd-report.json against error thresholds.
 *
 * Usage:
 *   deno task dsd:check-report
 *
 * Reads www/dist/dsd-report.json and checks:
 * 1. Non-recoverable errors must not exceed the v0.20 baseline.
 * 2. Unknown error types fail the gate by default.
 *
 * Override thresholds only for investigation:
 * - LESSJS_DSD_MAX_NON_RECOVERABLE=<number>
 * - LESSJS_DSD_MAX_UNKNOWN_ERROR_TYPES=<number>
 */

export interface RenderError {
  phase: string;
  tagName?: string;
  message: string;
  recoverable: boolean;
}

export interface DsdReport {
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
export const KNOWN_ERROR_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
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

export const DEFAULT_MAX_NON_RECOVERABLE = 6;
export const DEFAULT_MAX_UNKNOWN_ERROR_TYPES = 0;

export interface DsdGateOptions {
  maxNonRecoverable?: number;
  maxUnknownErrorTypes?: number;
}

export interface DsdGateResult {
  allErrors: Array<RenderError & { path: string }>;
  nonRecoverable: Array<RenderError & { path: string }>;
  recoverable: Array<RenderError & { path: string }>;
  errorGroups: Record<string, { count: number; tags: Set<string>; known: boolean }>;
  unknownErrors: Array<[string, { count: number; tags: Set<string>; known: boolean }]>;
  maxNonRecoverable: number;
  maxUnknownErrorTypes: number;
  passed: boolean;
  failures: string[];
}

export function evaluateDsdReportGate(
  report: DsdReport,
  options: DsdGateOptions = {},
): DsdGateResult {
  const maxNonRecoverable = options.maxNonRecoverable ?? DEFAULT_MAX_NON_RECOVERABLE;
  const maxUnknownErrorTypes = options.maxUnknownErrorTypes ?? DEFAULT_MAX_UNKNOWN_ERROR_TYPES;

  const allErrors: Array<RenderError & { path: string }> = [];
  for (const page of report.renderErrors) {
    for (const err of page.errors) {
      allErrors.push({ ...err, path: page.path });
    }
  }

  const nonRecoverable = allErrors.filter((e) => !e.recoverable);
  const recoverable = allErrors.filter((e) => e.recoverable);

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

  const unknownErrors = Object.entries(errorGroups).filter(([, info]) => !info.known);
  const failures: string[] = [];

  if (nonRecoverable.length > maxNonRecoverable) {
    failures.push(
      `${nonRecoverable.length} non-recoverable errors exceed threshold (${maxNonRecoverable})`,
    );
  }

  if (unknownErrors.length > maxUnknownErrorTypes) {
    failures.push(
      `${unknownErrors.length} unknown error type(s) exceed threshold (${maxUnknownErrorTypes})`,
    );
  }

  return {
    allErrors,
    nonRecoverable,
    recoverable,
    errorGroups,
    unknownErrors,
    maxNonRecoverable,
    maxUnknownErrorTypes,
    passed: failures.length === 0,
    failures,
  };
}

function readThreshold(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer, got "${raw}"`);
  }

  return value;
}

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

  let gate: DsdGateResult;
  try {
    gate = evaluateDsdReportGate(report, {
      maxNonRecoverable: readThreshold(
        'LESSJS_DSD_MAX_NON_RECOVERABLE',
        DEFAULT_MAX_NON_RECOVERABLE,
      ),
      maxUnknownErrorTypes: readThreshold(
        'LESSJS_DSD_MAX_UNKNOWN_ERROR_TYPES',
        DEFAULT_MAX_UNKNOWN_ERROR_TYPES,
      ),
    });
  } catch (error) {
    console.error(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }

  console.log(`  Non-recoverable: ${gate.nonRecoverable.length}`);
  console.log(`  Recoverable: ${gate.recoverable.length}`);

  console.log(`\n  Error breakdown:`);
  for (
    const [msg, info] of Object.entries(gate.errorGroups).sort(
      (a, b) => b[1].count - a[1].count,
    )
  ) {
    const status = info.known ? '[known]' : '[UNKNOWN]';
    console.log(
      `  ${status} [${info.count}x] ${msg.substring(0, 80)}`,
    );
    console.log(`      Tags: ${[...info.tags].slice(0, 5).join(', ')}`);
  }

  if (gate.unknownErrors.length > 0) {
    console.log(
      `\n  [WARN] ${gate.unknownErrors.length} unknown error type(s) detected. Consider adding to KNOWN_ERROR_PATTERNS only after triage.`,
    );
  }

  if (!gate.passed) {
    for (const failure of gate.failures) {
      console.error(`\n  [FAIL] ${failure}`);
    }
    Deno.exit(1);
  }

  console.log(
    `\n  [PASS] Gate passed (thresholds: non-recoverable <= ${gate.maxNonRecoverable}, unknown error types <= ${gate.maxUnknownErrorTypes})`,
  );
  console.log(
    `  [INFO] Known errors are from third-party client-only SSR boundaries.`,
  );
  console.log(
    `  [INFO] Threshold will tighten again for v0.22 when third-party SSR fallbacks are resolved.\n`,
  );
}

if (import.meta.main) {
  main();
}
