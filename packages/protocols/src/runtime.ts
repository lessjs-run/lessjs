/**
 * Runtime adapter protocol.
 *
 * This is the replacement boundary for Nitro, Workers, Node, Deno, or future
 * fetch-compatible runtimes. It preserves openElement semantics while leaving
 * concrete server engines outside this package.
 */

import type { CacheAdapter } from './cache.ts';

export interface RuntimeContext<Env extends Record<string, unknown> = Record<string, unknown>> {
  env?: Env;
  platform?: unknown;
  cache?: CacheAdapter<Response>;
}

export interface RuntimePrerenderResult {
  path: string;
  html: string;
  status?: number;
  headers?: HeadersInit;
}

export interface RuntimeAdapter<Env extends Record<string, unknown> = Record<string, unknown>> {
  name: string;
  fetch(request: Request, context?: RuntimeContext<Env>): Response | Promise<Response>;
  prerender?(): AsyncIterable<RuntimePrerenderResult> | Iterable<RuntimePrerenderResult>;
}
