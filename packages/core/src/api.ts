/**
 * @lessjs/core - API route contract.
 *
 * v0.21: Hono is LessJS's API runtime engine (14KB, Web-standard, edge-native).
 * For complex APIs, import Hono directly. LessApiContext is a thin convenience
 * wrapper for simple endpoints where full Hono is unnecessary.
 *
 * Usage:
 *   // Complex API → use Hono directly
 *   import { Hono } from 'hono';
 *   const app = new Hono().get('/api/users/:id', (c) => c.json({ id: c.req.param('id') }));
 *   export default app;
 *
 *   // Simple endpoint → use LessApiHandler
 *   export function GET(ctx: LessApiContext): Response {
 *     return Response.json({ hello: 'world' });
 *   }
 */

export interface LessApiContext {
  request: Request;
  params: Record<string, string>;
  env: Record<string, string | undefined>;
  platform?: unknown;
}

export type LessApiHandler = (
  ctx: LessApiContext,
) => Response | Promise<Response>;

export function createLessApiContext(
  request: Request,
  options: {
    params?: Record<string, string>;
    env?: Record<string, string | undefined>;
    platform?: unknown;
  } = {},
): LessApiContext {
  return {
    request,
    params: options.params || {},
    env: options.env || {},
    platform: options.platform,
  };
}
