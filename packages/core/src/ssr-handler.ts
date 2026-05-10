/**
 * @lessjs/core - SSR Handler (re-export facade).
 *
 * All implementation has been merged into html-escape.ts.
 * This file re-exports for backward compatibility with existing consumers.
 */
export { escapeHtml, renderSsrError, wrapInDocument } from './html-escape.js';
