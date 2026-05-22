/**
 * @lessjs/core - API route production contract.
 *
 * v0.21 standardizes the runtime shape API routes can rely on across dev,
 * build-generated handlers, and adapter deployments. It is deliberately small:
 * LessJS passes Web Request, route params, environment values, and an optional
 * platform object without owning auth, sessions, database access, or ORM state.
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
