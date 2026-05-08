/**
 * @lessjs/content/nav - Navigation module
 *
 * Auto-generates sidebar navigation from route file meta exports.
 * Produces .less/nav-data.json and virtual:less-nav module.
 */

export { extractMeta, scanNavData } from './scanner.ts';
export type { HeaderNavLink, NavItem, NavOptions, NavSection, RouteMeta } from '../types.ts';
