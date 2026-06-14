/**
 * @openelement/router - useLoaderData / useActionData hooks
 *
 * These hooks provide access to route loader and action data within page
 * renders. They read from the module-level data context set by
 * ApplicationPageElement.render().
 *
 * v0.40.0: Fresh-style data layer MVP.
 *
 * @example
 * ```tsx
 * import { useLoaderData, useActionData } from '@openelement/router';
 *
 * export default definePage({
 *   route: { path: '/examples/data' },
 *   render() {
 *     const data = useLoaderData<{ message: string }>();
 *     const actionData = useActionData<{ ok: boolean }>();
 *     return <main>
 *       <p>{data.message}</p>
 *     </main>;
 *   },
 * });
 * ```
 */

export { useActionData, useLoaderData } from './data-context.ts';
