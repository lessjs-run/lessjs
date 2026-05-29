/**
 * @lessjs/core - Streaming DSD Tests
 *
 * Tests for renderDSDStream() — progressive DSD delivery via Web Streams.
 */

import { assertEquals, assertExists, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  createRenderDSDStreamMetrics,
  renderDSDStream,
  type RenderDSDStreamComponent,
} from '../src/render-dsd.ts';

/** Helper: create a simple component class that renders a string. */
function makeComponent(body: () => string): CustomElementConstructor {
  return class {
    render(): string {
      return body();
    }
  } as unknown as CustomElementConstructor;
}

/** Helper: read entire stream into a string. */
async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(new TextDecoder().decode(value));
  }
  return chunks.join('');
}

/** Helper: collect all stream chunks as raw Uint8Array chunks. */
async function collectChunks(stream: ReadableStream<Uint8Array>): Promise<Uint8Array[]> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return chunks;
}

Deno.test('renderDSDStream: returns ReadableStream<Uint8Array>', () => {
  const stream = renderDSDStream([]);
  assertExists(stream);
  assertEquals(stream instanceof ReadableStream, true);
});

Deno.test('renderDSDStream: shell chunk is output first', async () => {
  const comp: RenderDSDStreamComponent = {
    tagName: 'shell-first-el',
    componentClass: makeComponent(() => '<div>body</div>'),
  };

  const stream = renderDSDStream([comp], { shell: '<!doctype html><html>' });
  const chunks = await collectChunks(stream);
  const first = new TextDecoder().decode(chunks[0]);

  assertStringIncludes(first, '<!doctype html>');
});

Deno.test('renderDSDStream: footer chunk is output last', async () => {
  const comp: RenderDSDStreamComponent = {
    tagName: 'footer-last-el',
    componentClass: makeComponent(() => '<div>body</div>'),
  };

  const stream = renderDSDStream([comp], { footer: '</html>' });
  const chunks = await collectChunks(stream);
  const last = new TextDecoder().decode(chunks[chunks.length - 1]);

  assertEquals(last, '</html>');
});

Deno.test('renderDSDStream: component chunks preserve priority order', async () => {
  const compA: RenderDSDStreamComponent = {
    tagName: 'first-el',
    componentClass: makeComponent(() => '<span>A</span>'),
  };
  const compB: RenderDSDStreamComponent = {
    tagName: 'second-el',
    componentClass: makeComponent(() => '<span>B</span>'),
  };
  const compC: RenderDSDStreamComponent = {
    tagName: 'third-el',
    componentClass: makeComponent(() => '<span>C</span>'),
  };

  const stream = renderDSDStream([compA, compB, compC]);
  const body = await readStream(stream);

  const posA = body.indexOf('<first-el>');
  const posB = body.indexOf('<second-el>');
  const posC = body.indexOf('<third-el>');

  assertEquals(posA < posB, true, 'A should come before B');
  assertEquals(posB < posC, true, 'B should come before C');
});

Deno.test('renderDSDStream: failing component outputs fallback and stream continues', async () => {
  class FailComponent {
    render(): string {
      throw new Error('simulated render failure');
    }
  }

  const fail: RenderDSDStreamComponent = {
    tagName: 'fail-el',
    componentClass: FailComponent as unknown as CustomElementConstructor,
  };
  const ok: RenderDSDStreamComponent = {
    tagName: 'ok-el',
    componentClass: makeComponent(() => '<div>still here</div>'),
  };

  const stream = renderDSDStream([fail, ok]);
  const body = await readStream(stream);

  // Failing component outputs bare tag fallback (not DSD wrapper)
  assertStringIncludes(body, '<fail-el>');
  // Stream continues — second component renders normally
  assertStringIncludes(body, '<ok-el>');
  assertStringIncludes(body, 'still here');
});

Deno.test('renderDSDStream: string output is rendered', async () => {
  class TemplateComp {
    render(): string {
      return '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>';
    }
  }

  const comp: RenderDSDStreamComponent = {
    tagName: 'escaped-el',
    componentClass: TemplateComp as unknown as CustomElementConstructor,
  };

  const stream = renderDSDStream([comp]);
  const body = await readStream(stream);

  // Script tag should be escaped
  assertStringIncludes(body, '&lt;script&gt;');
  // Raw script tag should not appear
  assertEquals(body.includes('<script>alert'), false);
});

Deno.test('renderDSDStream: metrics include chunkCount and errorCount', () => {
  const metrics = createRenderDSDStreamMetrics();

  assertEquals(metrics.chunkCount, 0);
  assertEquals(metrics.errorCount, 0);
  assertExists(metrics.startedAt);
  assertEquals(typeof metrics.startedAt, 'number');
});
