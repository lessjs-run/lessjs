/**
 * @lessjs/core - Virtual module ID constants.
 *
 * Shared between @lessjs/adapter-vite, @lessjs/content, and @lessjs/i18n.
 * Moved from adapter-vite to core to break the circular dependency:
 *   content -> adapter-vite/build-context + adapter-vite/virtual-ids
 *   adapter-vite -> content/sitemap (in generated code only)
 *
 * By placing these constants in core, content and i18n can import from
 * @lessjs/core/virtual-ids instead of @lessjs/adapter-vite/virtual-ids,
 * eliminating the module-level circular import.
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
