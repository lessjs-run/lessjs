/**
 * @lessjs/core - Streaming DSD Renderer.
 *
 * Progressive DSD delivery via Web Streams (ReadableStream<Uint8Array>).
 * Extracted from render-dsd.ts in v0.21.0 (SOP-003).
 *
 * Provides:
 *   - renderDSDStream() — stream components as they render
 *   - createRenderDSDStreamMetrics() — metrics collector factory
 *   - RenderDSDStreamChunk, RenderDSDStreamComponent,
 *     RenderDSDStreamMetrics, RenderDSDStreamOptions types
 *
 * @module @lessjs/core/render-dsd-stream
 */

import { renderDSD } from './render-dsd.js';
import type { RenderError, RenderOutput } from './types.js';

// --- Streaming types -------------------------------------------

export interface RenderDSDStreamChunk {
  html: string;
  output: RenderOutput;
}

export interface RenderDSDStreamMetrics {
  chunkCount: number;
  errorCount: number;
  startedAt: number;
  endedAt?: number;
}

export interface RenderDSDStreamOptions {
  shell?: string | (() => string | Promise<string>);
  footer?: string | (() => string | Promise<string>);
  onChunk?: (chunk: RenderDSDStreamChunk) => void;
  onError?: (error: RenderError, tagName: string) => void;
  metrics?: RenderDSDStreamMetrics;
}

export interface RenderDSDStreamComponent {
  tagName: string;
  componentClass: CustomElementConstructor;
  props?: Record<string, unknown>;
  sourceInfo?: { route?: string; source?: string };
  dsdOptions?: import('./types.js').DsdOptions;
}

const textEncoder = new TextEncoder();

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

async function resolveStreamPart(
  part?: string | (() => string | Promise<string>),
): Promise<string> {
  if (!part) return '';
  return typeof part === 'function' ? await part() : part;
}

/**
 * Create a fresh metrics collector for streaming DSD.
 */
export function createRenderDSDStreamMetrics(): RenderDSDStreamMetrics {
  return {
    chunkCount: 0,
    errorCount: 0,
    startedAt: now(),
  };
}

/**
 * Render components as a streaming DSD response.
 *
 * Returns a ReadableStream<Uint8Array> that emits:
 *   1. Shell (opening HTML)
 *   2. Each component's DSD output, in order
 *   3. Footer (closing HTML)
 *
 * Failed components emit a bare-tag fallback and the stream continues.
 * Compatible with Web Response constructor for edge handlers.
 *
 * @param components - Iterable of components to render
 * @param options - Stream options (shell, footer, callbacks, metrics)
 * @returns ReadableStream of encoded DSD HTML chunks
 */
export function renderDSDStream(
  components: Iterable<RenderDSDStreamComponent>,
  options: RenderDSDStreamOptions = {},
): ReadableStream<Uint8Array> {
  const encoderMetrics = options.metrics ?? createRenderDSDStreamMetrics();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const shell = await resolveStreamPart(options.shell);
        if (shell) {
          controller.enqueue(textEncoder.encode(shell));
          encoderMetrics.chunkCount++;
        }

        for (const component of components) {
          const output = await renderDSD(
            component.tagName,
            component.componentClass,
            component.props ?? {},
            component.sourceInfo,
            component.dsdOptions,
          );
          for (const error of output.errors) {
            encoderMetrics.errorCount++;
            options.onError?.(error, component.tagName);
          }
          controller.enqueue(textEncoder.encode(output.html));
          encoderMetrics.chunkCount++;
          options.onChunk?.({ html: output.html, output });
        }

        const footer = await resolveStreamPart(options.footer);
        if (footer) {
          controller.enqueue(textEncoder.encode(footer));
          encoderMetrics.chunkCount++;
        }
        encoderMetrics.endedAt = now();
        controller.close();
      } catch (error) {
        encoderMetrics.errorCount++;
        encoderMetrics.endedAt = now();
        controller.error(error);
      }
    },
  });
}
