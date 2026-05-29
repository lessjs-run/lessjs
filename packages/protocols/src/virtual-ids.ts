/**
 * @lessjs/protocols — Virtual module IDs for build-time data injection.
 *
 * These constants are the single source of truth for the virtual module
 * names used by @lessjs/content and @lessjs/i18n. The build adapter
 * (@lessjs/adapter-vite) resolves these IDs at build time.
 *
 * All packages should import from here, not from @lessjs/adapter-vite/virtual-ids.
 */

export const VIRTUAL_BLOG_DATA_ID = 'virtual:less-blog-data';
export const RESOLVED_BLOG_DATA_ID = '\0' + VIRTUAL_BLOG_DATA_ID;

export const VIRTUAL_I18N_DATA_ID = 'virtual:less-i18n-data';
export const RESOLVED_I18N_DATA_ID = '\0' + VIRTUAL_I18N_DATA_ID;

export const VIRTUAL_NAV_ID = 'virtual:less-nav';
export const RESOLVED_NAV_ID = '\0' + VIRTUAL_NAV_ID;
