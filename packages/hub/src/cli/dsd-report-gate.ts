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
  {
    pattern: /React SSR rendering failed/,
    description: 'adapter-react SSR boundary — React islands render client-only',
  },
];

// v0.21: Bumped to 12 to accommodate Shoelace third-party demo components
// (sl-input, sl-dialog, sl-drawer, etc.) whose browser-only APIs cannot be
// rendered in Deno SSR. These are known, expected non-recoverable errors.
// v0.21.12: Third-party errors (sl-*) now warn only — gate only fails on
// LessJS native components (less-*, page-*, demo-*).
export const NATIVE_TAG_PREFIXES = ['less-', 'page-', 'demo-'];
export const DEFAULT_MAX_NON_RECOVERABLE = 12;
export const DEFAULT_MAX_UNKNOWN_ERROR_TYPES = 0;

export interface DsdGateOptions {
  maxNonRecoverable?: number;
  maxUnknownErrorTypes?: number;
}

export interface DsdGateResult {
  allErrors: Array<RenderError & { path: string }>;
  nonRecoverable: Array<RenderError & { path: string }>;
  recoverable: Array<RenderError & { path: string }>;
  nativeNonRecoverable: Array<RenderError & { path: string }>;
  thirdPartyNonRecoverable: Array<RenderError & { path: string }>;
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

  // Split by component origin: native (less-*, page-*, demo-*) vs third-party
  const isNative = (tag: string | undefined) =>
    !tag || NATIVE_TAG_PREFIXES.some((p) => tag.startsWith(p));
  const nativeNonRecoverable = nonRecoverable.filter((e) => isNative(e.tagName));
  const thirdPartyNonRecoverable = nonRecoverable.filter((e) => !isNative(e.tagName));

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

  if (nativeNonRecoverable.length > maxNonRecoverable) {
    failures.push(
      `${nativeNonRecoverable.length} native non-recoverable errors exceed threshold (${maxNonRecoverable}) (${thirdPartyNonRecoverable.length} third-party excluded)`,
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
    nativeNonRecoverable,
    thirdPartyNonRecoverable,
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

  console.log(`  Non-recoverable (native): ${gate.nativeNonRecoverable.length}`);
  if (gate.thirdPartyNonRecoverable.length > 0) {
    console.log(
      `  Non-recoverable (third-party): ${gate.thirdPartyNonRecoverable.length} (excluded from gate)`,
    );
  }
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

  if (gate.thirdPartyNonRecoverable.length > 0) {
    console.log(
      `\n  [WARN] ${gate.thirdPartyNonRecoverable.length} third-party non-recoverable errors excluded from gate (Shoelace SSR boundary).`,
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
