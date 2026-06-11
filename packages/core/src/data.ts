/**
 * @openelement/core - Data adapter compatibility exports.
 *
 * The platform-neutral data protocol is owned by @openelement/protocols. Core
 * keeps this module as the stable historical import path.
 *
 * @see ADR-0095: Data / Database Boundary
 * @module @openelement/core/data
 */

export { MemoryDataAdapter } from '@openelement/protocols/data';
export type { DataAdapter } from '@openelement/protocols/data';
