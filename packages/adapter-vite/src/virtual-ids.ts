/**
 * @lessjs/adapter-vite - Virtual module ID constants.
 *
 * Vite virtual module IDs used by adapter-vite, @lessjs/content,
 * and @lessjs/i18n. Kept in adapter-vite (not core) because
 * core is a pure runtime and should not contain Vite-specific knowledge.
 *
 * Prefix: VIRTUAL_ = user-facing virtual module name (e.g., 'virtual:less-blog-data')
 *         RESOLVED_ = Vite-resolved form (\0 prefix = Vite internal namespace)
 */
export const VIRTUAL_BLOG_DATA_ID = 'virtual:less-blog-data';
export const RESOLVED_BLOG_DATA_ID = '\0' + VIRTUAL_BLOG_DATA_ID;

export const VIRTUAL_I18N_DATA_ID = 'virtual:less-i18n-data';
export const RESOLVED_I18N_DATA_ID = '\0' + VIRTUAL_I18N_DATA_ID;

/** Nav virtual module — used by @lessjs/content and @lessjs/adapter-vite SSG */
export const VIRTUAL_NAV_ID = 'virtual:less-nav';
export const RESOLVED_NAV_ID = '\0' + VIRTUAL_NAV_ID;
