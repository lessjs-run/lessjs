/**
 * @lessjs/core - SSR Security Guards.
 *
 * Properties that MUST NOT be injected from untrusted SSR props.
 * These are Object.prototype internals and dangerous overrides that
 * could be exploited via arbitrary property assignment.
 *
 * Shared by island.ts (client-side lessBind) and render-instantiate.ts
 * (SSR injectProps). Previously defined in island.ts and imported by
 * render-instantiate.ts, creating a false coupling — render-instantiate
 * is an SSR module that shouldn't depend on client-side island logic.
 *
 * @module @lessjs/core/security
 */

/** Object prototype keys that must never be injected as SSR props. */
export const DANGEROUS_KEYS: ReadonlySet<string> = new Set([
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toString',
  'toLocaleString',
  'valueOf',
]);
