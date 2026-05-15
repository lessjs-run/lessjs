/**
 * @lessjs/core - errors.ts tests (Deno)
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { LessError, SsrRenderError } from '../src/errors.ts';

Deno.test('errors', async (t) => {
  await t.step('LessError has code and statusCode', () => {
    const err = new LessError('test', 'TEST_ERROR', 400);
    assertEquals(err.code, 'TEST_ERROR');
    assertEquals(err.statusCode, 400);
    assertEquals(err.isOperational, true);
    assertEquals(err.name, 'LessError');
  });

  await t.step('SsrRenderError is not operational', () => {
    const cause = new Error('render failed');
    const err = new SsrRenderError('app/routes/index.ts', cause);
    assertEquals(err.statusCode, 500);
    assertEquals(err.isOperational, false);
    assertEquals(err.sourceError, cause);
  });

  await t.step('toJSON returns structured error', () => {
    const err = new LessError('test error', 'TEST', 400);
    const json = err.toJSON();
    assertEquals(json, {
      error: {
        code: 'TEST',
        message: 'test error',
      },
    });
  });
});
