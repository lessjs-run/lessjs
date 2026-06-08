/**
 * @openelement/core - Streaming Dsd Tests
 *
 * Tests for renderDsdStream() progressive Dsd delivery via Web Streams.
 */

import { assertEquals, assertExists, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  createRenderDsdStreamMetrics,
  renderDsdStream,
  type RenderDsdStreamComponent,
} from '../src/render-dsd.ts';
import { jsx } from '../src/jsx-runtime.ts';
import type { VNode } from '../src/vnode.ts';

/** Helper: create a simple component class that renders a VNode. */
function makeComponent(body: () => VNode | null): CustomElementConstructor {
  return class {
    render(): VNode | null {
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

Deno.test('renderDsdStream: returns ReadableStream<Uint8Array>', () => {
  const stream = renderDsdStream([]);
  assertExists(stream);
  assertEquals(stream instanceof ReadableStream, true);
});

Deno.test('renderDsdStream: can be consumed by a Web Response', async () => {
  const comp: RenderDsdStreamComponent = {
    tagName: 'stream-response-card',
    componentClass: makeComponent(() => jsx('p', { children: 'stream response body' })),
  };

  const response = new Response(
    renderDsdStream([comp], {
      shell: '<!doctype html><html><body>',
      footer: '</body></html>',
    }),
    {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    },
  );

  assertEquals(response.headers.get('content-type'), 'text/html; charset=utf-8');
  const body = await response.text();
  assertEquals(body.includes('<!doctype html><html><body>'), true);
  assertEquals(body.includes('stream response body'), true);
  assertEquals(body.includes('</body></html>'), true);
});

Deno.test('renderDsdStream: shell chunk is output first', async () => {
  const comp: RenderDsdStreamComponent = {
    tagName: 'shell-first-el',
    componentClass: makeComponent(() => jsx('div', { children: 'body' })),
  };

  const stream = renderDsdStream([comp], { shell: '<!doctype html><html>' });
  const chunks = await collectChunks(stream);
  const first = new TextDecoder().decode(chunks[0]);

  assertStringIncludes(first, '<!doctype html>');
});

Deno.test('renderDsdStream: footer chunk is output last', async () => {
  const comp: RenderDsdStreamComponent = {
    tagName: 'footer-last-el',
    componentClass: makeComponent(() => jsx('div', { children: 'body' })),
  };

  const stream = renderDsdStream([comp], { footer: '</html>' });
  const chunks = await collectChunks(stream);
  const last = new TextDecoder().decode(chunks[chunks.length - 1]);

  assertEquals(last, '</html>');
});

Deno.test('renderDsdStream: component chunks preserve priority order', async () => {
  const compA: RenderDsdStreamComponent = {
    tagName: 'first-el',
    componentClass: makeComponent(() => jsx('span', { children: 'A' })),
  };
  const compB: RenderDsdStreamComponent = {
    tagName: 'second-el',
    componentClass: makeComponent(() => jsx('span', { children: 'B' })),
  };
  const compC: RenderDsdStreamComponent = {
    tagName: 'third-el',
    componentClass: makeComponent(() => jsx('span', { children: 'C' })),
  };

  const stream = renderDsdStream([compA, compB, compC]);
  const body = await readStream(stream);

  const posA = body.indexOf('<first-el>');
  const posB = body.indexOf('<second-el>');
  const posC = body.indexOf('<third-el>');

  assertEquals(posA < posB, true, 'A should come before B');
  assertEquals(posB < posC, true, 'B should come before C');
});

Deno.test('renderDsdStream: failing component outputs fallback and stream continues', async () => {
  class FailComponent {
    render(): VNode {
      throw new Error('simulated render failure');
    }
  }

  const fail: RenderDsdStreamComponent = {
    tagName: 'fail-el',
    componentClass: FailComponent as unknown as CustomElementConstructor,
  };
  const ok: RenderDsdStreamComponent = {
    tagName: 'ok-el',
    componentClass: makeComponent(() => jsx('div', { children: 'still here' })),
  };

  const stream = renderDsdStream([fail, ok]);
  const body = await readStream(stream);

  assertStringIncludes(body, '<fail-el>');
  assertStringIncludes(body, '<ok-el>');
  assertStringIncludes(body, 'still here');
});

Deno.test('renderDsdStream: VNode text output is escaped', async () => {
  class TemplateComp {
    render(): VNode {
      return jsx('p', { children: '<script>alert(1)</script>' });
    }
  }

  const comp: RenderDsdStreamComponent = {
    tagName: 'escaped-el',
    componentClass: TemplateComp as unknown as CustomElementConstructor,
  };

  const stream = renderDsdStream([comp]);
  const body = await readStream(stream);

  assertStringIncludes(body, '&lt;script&gt;');
  assertEquals(body.includes('<script>alert'), false);
});

Deno.test('renderDsdStream: metrics include chunkCount and errorCount', () => {
  const metrics = createRenderDsdStreamMetrics();

  assertEquals(metrics.chunkCount, 0);
  assertEquals(metrics.errorCount, 0);
  assertExists(metrics.startedAt);
  assertEquals(typeof metrics.startedAt, 'number');
});
