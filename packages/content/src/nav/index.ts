/**
 * @lessjs/content/nav - Navigation module
 *
 * Auto-generates sidebar navigation from route file meta exports.
 * Data is stored in ctx.navSections and exposed via virtual:less-nav module.
 */

export { extractMeta, scanNavData } from './scanner.ts';
export type { NavData } from './scanner.ts';
export { writeNavModule } from './writer.ts';
export type { HeaderNavLink, NavItem, NavOptions, NavSection, RouteMeta } from '../types.ts';
