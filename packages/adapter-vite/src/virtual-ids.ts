/**
 * Compatibility re-export for v0.23.
 *
 * Canonical virtual module IDs live in @lessjs/protocols. This path remains
 * temporarily so existing consumers of @lessjs/adapter-vite/virtual-ids keep
 * working during the migration window.
 */
export {
  RESOLVED_BLOG_DATA_ID,
  RESOLVED_I18N_DATA_ID,
  RESOLVED_NAV_ID,
  RESOLVED_PAGE_DATA_ID,
  VIRTUAL_BLOG_DATA_ID,
  VIRTUAL_I18N_DATA_ID,
  VIRTUAL_NAV_ID,
  VIRTUAL_PAGE_DATA_ID,
} from '@lessjs/protocols/virtual-ids';
