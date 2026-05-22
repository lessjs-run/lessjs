import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  DEFAULT_MAX_NON_RECOVERABLE,
  DEFAULT_MAX_UNKNOWN_ERROR_TYPES,
  type DsdReport,
  evaluateDsdReportGate,
} from '../src/cli/dsd-report-gate.ts';

function reportWith(messages: Array<{ message: string; recoverable: boolean }>): DsdReport {
  return {
    totalErrors: messages.length,
    renderErrors: [
      {
        path: '/registry/example',
        errors: messages.map((message) => ({
          phase: 'render',
          tagName: 'sl-button',
          ...message,
        })),
        hydrationHints: [],
        componentCount: 1,
        renderTimeMs: 1,
      },
    ],
  };
}

Deno.test('evaluateDsdReportGate passes known errors within v0.20 thresholds', () => {
  const report = reportWith([
    { message: 'this.host.querySelector is not a function', recoverable: true },
    { message: 'this.host.childNodes is not iterable', recoverable: false },
  ]);

  const result = evaluateDsdReportGate(report);

  assertEquals(result.passed, true);
  assertEquals(result.failures, []);
  assertEquals(result.maxNonRecoverable, DEFAULT_MAX_NON_RECOVERABLE);
  assertEquals(result.maxUnknownErrorTypes, DEFAULT_MAX_UNKNOWN_ERROR_TYPES);
});

Deno.test('evaluateDsdReportGate fails unknown error types by default', () => {
  const report = reportWith([
    { message: 'Unexpected registry component render failure', recoverable: true },
  ]);

  const result = evaluateDsdReportGate(report);

  assertEquals(result.passed, false);
  assertEquals(result.unknownErrors.length, 1);
  assertEquals(result.failures, ['1 unknown error type(s) exceed threshold (0)']);
});

Deno.test('evaluateDsdReportGate fails non-recoverable errors above threshold', () => {
  const report = reportWith([
    { message: 'Failed to instantiate', recoverable: false },
    { message: 'Failed to instantiate', recoverable: false },
  ]);

  const result = evaluateDsdReportGate(report, { maxNonRecoverable: 1 });

  assertEquals(result.passed, false);
  assertEquals(result.failures, ['2 non-recoverable errors exceed threshold (1)']);
});
