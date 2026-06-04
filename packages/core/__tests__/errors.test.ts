/**
 * @openelement/core - errors.ts tests (Deno)
 * ADR-0053: Updated for unified error architecture.
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { ErrorCode, LessError, SsrRenderError } from '../src/errors.ts';

Deno.test('errors', async (t) => {
  await t.step('LessError has code, severity, phase, recoverable', () => {
    const err = new LessError('test', ErrorCode.RENDER_ERROR, 'error', 'render', true);
    assertEquals(err.code, ErrorCode.RENDER_ERROR);
    assertEquals(err.severity, 'error');
    assertEquals(err.phase, 'render');
    assertEquals(err.recoverable, true);
    assertEquals(err.name, 'LessError');
  });

  await t.step('SsrRenderError extends RenderError', () => {
    const cause = new Error('render failed');
    const err = new SsrRenderError('app/routes/index.ts', cause);
    assertEquals(err.code, ErrorCode.SSR_RENDER_ERROR);
    assertEquals(err.severity, 'error');
    assertEquals(err.recoverable, false);
    assertEquals(err.sourceError, cause);
    assertEquals(err.componentPath, 'app/routes/index.ts');
  });

  await t.step('toJSON returns structured error', () => {
    const err = new LessError('test error', ErrorCode.UNKNOWN, 'warning', 'build', false);
    const json = err.toJSON() as Record<string, unknown>;
    assertEquals(json.code, ErrorCode.UNKNOWN);
    assertEquals(json.message, 'test error');
    assertEquals(json.severity, 'warning');
    assertEquals(json.phase, 'build');
  });
});
