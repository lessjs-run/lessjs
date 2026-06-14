/**
 * Locale-aware path normalization shared by @openelement/router and @openelement/i18n.
 *
 * This utility is intentionally placed in protocol (the lowest-level type package)
 * so both router and i18n can share a single implementation without i18n needing
 * to own routing concerns or router needing to depend on i18n.
 */

export type { LocalePath } from '@openelement/protocol';
export { normalizeLocalePath } from '@openelement/protocol';
