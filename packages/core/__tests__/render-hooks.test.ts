/**
 * @lessjs/core - RenderHooks unit tests (Deno)
 *
 * Tests for the render pipeline hooks: beforeRender, afterRender, onError.
 * Covers success, failure, and undefined hooks scenarios.
 */
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { renderDSD } from '../src/render-dsd.ts';
import { registerAdapter } from '../src/adapter-registry.ts';
import type { RenderHooks, RenderOutput, RenderInput, RenderError } from '../src/types.ts';

// ─── Mock Component Classes ──────────────────────────────────

interface MockComponent {
  render(): string | unknown;
  [key: string]: unknown;
  layer?: string;
}

/** Create a mock component class with a render() method */
function createMockClass(
  renderContent: string,
  extra?: {
    layer?: string;
    throwOnConstruct?: boolean;
    throwOnRender?: boolean;
    renderValue?: unknown;
  },
): new () => MockComponent {
  if (extra?.throwOnConstruct) {
    return class {
      constructor() {
        throw new Error('Construction failed');
      }
    } as unknown as new () => MockComponent;
  }

  const layerVal = extra?.layer;
  const throwOnRender = extra?.throwOnRender;
  const renderValue = extra?.renderValue;

  const cls = class {
    layer = layerVal;
    render() {
      if (throwOnRender) throw new Error('Render exploded');
      if (renderValue !== undefined) return renderValue;
      return renderContent;
    }
  };

  return cls as unknown as new () => MockComponent;
}

/** Cast mock class to CustomElementConstructor for renderDSD */
function asCtor(cls: new () => MockComponent): CustomElementConstructor {
  return cls as unknown as CustomElementConstructor;
}

// ─── beforeRender hook ──────────────────────────────────────

Deno.test('RenderHooks — beforeRender', async (t) => {
  await t.step('beforeRender fires before instantiation', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<p>Hello</p>');
    const callOrder: string[] = [];

    const hooks: RenderHooks = {
      beforeRender(_input: RenderInput) {
        callOrder.push('beforeRender');
      },
      afterRender(_output: RenderOutput) {
        callOrder.push('afterRender');
      },
    };

    await renderDSD('hook-test-1', asCtor(cls), {}, undefined, undefined, undefined, 0, hooks);

    assertEquals(callOrder, ['beforeRender', 'afterRender']);
  });

  await t.step('beforeRender receives correct RenderInput', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<p>Hello</p>');
    let receivedInput: RenderInput | undefined;

    const hooks: RenderHooks = {
      beforeRender(input: RenderInput) {
        receivedInput = input;
      },
    };

    await renderDSD('hook-test-2', asCtor(cls), { name: 'test' }, undefined, undefined, undefined, 0, hooks);

    assertEquals(receivedInput!.tagName, 'hook-test-2');
    assertEquals(receivedInput!.props.name, 'test');
    assertEquals(receivedInput!.nestingDepth, 0);
  });

  await t.step('beforeRender hook throwing does not break rendering', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<p>Hello</p>');

    const hooks: RenderHooks = {
      beforeRender() {
        throw new Error('Hook exploded');
      },
    };

    // Should not throw — hook errors are caught silently
    const output = await renderDSD('hook-test-3', asCtor(cls), {}, undefined, undefined, undefined, 0, hooks);
    assertStringIncludes(output.html, '<p>Hello</p>');
  });
});

// ─── afterRender hook ───────────────────────────────────────

Deno.test('RenderHooks — afterRender', async (t) => {
  await t.step('afterRender receives full RenderOutput', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<p>World</p>');
    let receivedOutput: RenderOutput | undefined;

    const hooks: RenderHooks = {
      afterRender(output: RenderOutput) {
        receivedOutput = output;
      },
    };

    await renderDSD('hook-test-4', asCtor(cls), {}, undefined, undefined, undefined, 0, hooks);

    assertEquals(receivedOutput!.errors.length, 0);
    assertStringIncludes(receivedOutput!.html, '<p>World</p>');
    assertEquals(typeof receivedOutput!.metrics.renderTimeMs, 'number');
    assertEquals(receivedOutput!.metrics.tagName, 'hook-test-4');
  });

  await t.step('afterRender receives errors from failed render', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('', { throwOnRender: true });
    let receivedOutput: RenderOutput | undefined;

    const hooks: RenderHooks = {
      afterRender(output: RenderOutput) {
        receivedOutput = output;
      },
    };

    await renderDSD('hook-test-5', asCtor(cls), {}, undefined, undefined, undefined, 0, hooks);

    assertEquals(receivedOutput!.errors.length > 0, true);
    assertEquals(receivedOutput!.errors[0].phase, 'render');
    assertEquals(receivedOutput!.errors[0].tagName, 'hook-test-5');
  });

  await t.step('afterRender receives errors from failed instantiation', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('', { throwOnConstruct: true });
    let receivedOutput: RenderOutput | undefined;

    const hooks: RenderHooks = {
      afterRender(output: RenderOutput) {
        receivedOutput = output;
      },
    };

    await renderDSD('hook-test-6', asCtor(cls), {}, undefined, undefined, undefined, 0, hooks);

    assertEquals(receivedOutput!.errors.length > 0, true);
    assertEquals(receivedOutput!.errors[0].phase, 'instantiate');
    assertEquals(receivedOutput!.errors[0].tagName, 'hook-test-6');
  });
});

// ─── onError hook ───────────────────────────────────────────

Deno.test('RenderHooks — onError', async (t) => {
  await t.step('onError fires for instantiation errors', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('', { throwOnConstruct: true });
    const receivedErrors: RenderError[] = [];

    const hooks: RenderHooks = {
      onError(error: RenderError) {
        receivedErrors.push(error);
      },
    };

    await renderDSD('hook-test-7', asCtor(cls), {}, undefined, undefined, undefined, 0, hooks);

    assertEquals(receivedErrors.length, 1);
    assertEquals(receivedErrors[0].phase, 'instantiate');
    assertEquals(receivedErrors[0].tagName, 'hook-test-7');
    assertEquals(receivedErrors[0].recoverable, false);
  });

  await t.step('onError fires for render() errors', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('', { throwOnRender: true });
    const receivedErrors: RenderError[] = [];

    const hooks: RenderHooks = {
      onError(error: RenderError) {
        receivedErrors.push(error);
      },
    };

    await renderDSD('hook-test-8', asCtor(cls), {}, undefined, undefined, undefined, 0, hooks);

    assertEquals(receivedErrors.length, 1);
    assertEquals(receivedErrors[0].phase, 'render');
    assertEquals(receivedErrors[0].recoverable, true);
  });

  await t.step('onError fires for wrong return type', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('', { renderValue: { notAString: true } });
    const receivedErrors: RenderError[] = [];

    const hooks: RenderHooks = {
      onError(error: RenderError) {
        receivedErrors.push(error);
      },
    };

    await renderDSD('hook-test-9', asCtor(cls), {}, undefined, undefined, undefined, 0, hooks);

    assertEquals(receivedErrors.length, 1);
    assertEquals(receivedErrors[0].phase, 'render');
  });
});

// ─── Hooks are optional ─────────────────────────────────────

Deno.test('RenderHooks — optional (undefined)', async (t) => {
  await t.step('pipeline works with no hooks', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<p>No hooks</p>');

    const output = await renderDSD('hook-test-10', asCtor(cls), {}, undefined, undefined, undefined, 0, undefined);

    assertStringIncludes(output.html, '<p>No hooks</p>');
    assertEquals(output.errors.length, 0);
  });

  await t.step('pipeline works with empty hooks object', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<p>Empty hooks</p>');

    const output = await renderDSD('hook-test-11', asCtor(cls), {}, undefined, undefined, undefined, 0, {});

    assertStringIncludes(output.html, '<p>Empty hooks</p>');
    assertEquals(output.errors.length, 0);
  });

  await t.step('pipeline behavior unchanged when hooks are undefined', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<p>Same behavior</p>');

    const withHooks = await renderDSD('hook-test-12a', asCtor(cls), {}, undefined, undefined, undefined, 0, {});
    const withoutHooks = await renderDSD('hook-test-12b', asCtor(cls), {}, undefined, undefined, undefined, 0, undefined);

    // HTML output should be identical (except for tag name differences)
    assertEquals(withHooks.errors.length, withoutHooks.errors.length);
    assertEquals(withHooks.hydrationHints.length, withoutHooks.hydrationHints.length);
  });
});

// ─── RenderOutput shape ─────────────────────────────────────

Deno.test('RenderOutput — structured output', async (t) => {
  await t.step('successful render returns RenderOutput with html, errors, metrics, hydrationHints', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('<p>Full output</p>');

    const output = await renderDSD('output-test-1', asCtor(cls), { name: 'test' });

    // html
    assertStringIncludes(output.html, 'output-test-1');
    assertStringIncludes(output.html, '<p>Full output</p>');
    assertStringIncludes(output.html, 'name="test"');

    // errors
    assertEquals(output.errors.length, 0);

    // metrics
    assertEquals(output.metrics.tagName, 'output-test-1');
    assertEquals(typeof output.metrics.renderTimeMs, 'number');
    assertEquals(output.metrics.layer, 'dsd-static');
    assertEquals(output.metrics.hasError, false);
    assertEquals(output.metrics.nestingDepth, 0);

    // hydrationHints
    assertEquals(Array.isArray(output.hydrationHints), true);
  });

  await t.step('failed render returns RenderOutput with errors', async () => {
    registerAdapter(undefined);
    const cls = createMockClass('', { throwOnRender: true });

    const output = await renderDSD('output-test-2', asCtor(cls), {});

    // html still contains error placeholder
    assertStringIncludes(output.html, 'LessJS ERROR');

    // errors array is populated
    assertEquals(output.errors.length > 0, true);
    assertEquals(output.metrics.hasError, true);
  });
});
