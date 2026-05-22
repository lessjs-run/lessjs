/**
 * @lessjs/core - API route contract.
 *
 * LessJS uses Hono (https://hono.dev) as its API runtime engine — 14KB,
 * Web-standard, edge-native. For complex APIs, import Hono directly.
 *
 * LessApiContext is a convenience type describing the flat context object
 * passed to simple API route handlers:
 *
 *   export function GET(ctx: LessApiContext): Response {
 *     return Response.json({ id: ctx.params.id });
 *   }
 *
 * For full Hono features (middleware, streaming, validation), use Hono directly:
 *
 *   import { Hono } from 'hono';
 *   const app = new Hono().get('/users/:id', (c) => c.json({ id: c.req.param('id') }));
 *   export default app;
 */

export interface LessApiContext {
  request: Request;
  params: Record<string, string>;
  env: Record<string, string | undefined>;
  platform?: unknown;
}
