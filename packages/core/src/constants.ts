/**
 * @lessjs/core - Shared virtual module ID constants.
 *
 * Virtual module IDs used by @lessjs/adapter-vite, @lessjs/content,
 * and @lessjs/i18n. Defined here to avoid circular dependencies
 * between those packages.
 *
 * Prefix: VIRTUAL_ = user-facing virtual module name (e.g., 'virtual:less-blog-data')
 *         RESOLVED_ = Vite-resolved form (\0 prefix = Vite internal namespace)
 */
export const VIRTUAL_BLOG_DATA_ID = 'virtual:less-blog-data';
export const RESOLVED_BLOG_DATA_ID = '\0' + VIRTUAL_BLOG_DATA_ID;

export const VIRTUAL_I18N_DATA_ID = 'virtual:less-i18n-data';
export const RESOLVED_I18N_DATA_ID = '\0' + VIRTUAL_I18N_DATA_ID;
