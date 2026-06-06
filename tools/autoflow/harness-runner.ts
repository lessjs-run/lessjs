/**
 * Harness gate runner — v0.35.0
 *
 * Runs the 12 release gates and collects structured results.
 * Each gate is a deterministic operation (Brooks: accidental difficulty).
 * Used by both autoflow:check (CI gate) and autoflow:evolve (cell execution).
 */

export interface HarnessGateResult {
  gate: string;
  passed: boolean;
  durationMs: number;
  output: string;
}

export interface HarnessRunResult {
  allPassed: boolean;
  failedGates: HarnessGateResult[];
  passedGates: HarnessGateResult[];
  totalDurationMs: number;
}

/**
 * The 12 release gates in execution order.
 * Matches STATUS.md Release Gate Order.
 */
export const ALL_GATES: readonly string[] = [
  'fmt:check',
  'lint',
  'typecheck',
  'test',
  'build',
  'workflow:check',
  'arch:check',
  'graph:check',
  'docs:check-current',
  'docs:check-strategy',
  'dsd:check-report',
  'publish:dry-run',
];

/**
 * Run a single gate by executing its deno task.
 */
export function runGate(projectRoot: string, gate: string): HarnessGateResult {
  const start = performance.now();
  const command = new Deno.Command('deno', {
    args: ['task', gate],
    cwd: projectRoot,
    stdout: 'piped',
    stderr: 'piped',
  });

  let output = '';
  let passed = false;

  try {
    const result = command.outputSync();
    const stdout = new TextDecoder().decode(result.stdout);
    const stderr = new TextDecoder().decode(result.stderr);
    output = (stdout + stderr).slice(0, 2000); // truncate
    passed = result.code === 0;
  } catch (err) {
    output = `Error running gate: ${String(err)}`;
    passed = false;
  }

  const durationMs = Math.round(performance.now() - start);

  return { gate, passed, durationMs, output };
}

/**
 * Run all 12 gates and collect results.
 */
export function runAllGates(projectRoot: string): HarnessRunResult {
  const results: HarnessGateResult[] = [];
  const start = performance.now();

  for (const gate of ALL_GATES) {
    results.push(runGate(projectRoot, gate));
  }

  const passedGates = results.filter((r) => r.passed);
  const failedGates = results.filter((r) => !r.passed);
  const totalDurationMs = Math.round(performance.now() - start);

  return {
    allPassed: failedGates.length === 0,
    failedGates,
    passedGates,
    totalDurationMs,
  };
}
