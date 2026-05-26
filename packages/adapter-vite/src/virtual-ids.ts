/**
 * @lessjs/adapter-vite - Virtual module ID constants.
 *
 * Originally in @lessjs/adapter-vite, then moved to @lessjs/core (G10 fix)
 * to break the adapter-vite <-> content circular dependency.
 * Moved back to adapter-vite in v0.22 (SOP-002) — the circular dependency
 * is resolved because adapter-vite no longer imports from content or i18n
 * at module level.
 *
 * Shared between @lessjs/adapter-vite, @lessjs/content, and @lessjs/i18n.
 */

/** Virtual module ID for blog data */
export const VIRTUAL_BLOG_DATA_ID = 'virtual:less-blog-data';
export const RESOLVED_BLOG_DATA_ID = '\0' + VIRTUAL_BLOG_DATA_ID;

/** Virtual module ID for i18n data */
export const VIRTUAL_I18N_DATA_ID = 'virtual:less-i18n-data';
export const RESOLVED_I18N_DATA_ID = '\0' + VIRTUAL_I18N_DATA_ID;

/** Virtual module ID for nav data - used by @lessjs/content and @lessjs/adapter-vite SSG */
export const VIRTUAL_NAV_ID = 'virtual:less-nav';
export const RESOLVED_NAV_ID = '\0' + VIRTUAL_NAV_ID;

/** Virtual module ID for page data */
export const VIRTUAL_PAGE_DATA_ID = 'virtual:less-page-data';
export const RESOLVED_PAGE_DATA_ID = '\0' + VIRTUAL_PAGE_DATA_ID;
