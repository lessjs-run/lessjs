/**
 * @lessjs/adapter-vite - Virtual module ID constants.
 *
 * G10 fix: Canonical definitions moved to @lessjs/core/virtual-ids
 * to break the adapter-vite ↔ content circular dependency.
 * This module re-exports for consumers that import from adapter-vite.
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
} from '@lessjs/core/virtual-ids';
