/**
 * nav-filter.ts - Sidebar navigation filtering utilities.
 *
 * The `less-layout` component renders all navItems without filtering.
 * These functions allow route components to pass only relevant navSections
 * to the sidebar, so docs pages show Docs sections, architecture pages
 * show Architecture sections, etc.
 */

/** Section titles shown in the Docs sidebar. */
const DOCS_SECTIONS = ['Quick Start', 'Core', 'Production'];

/** Section titles shown in the Architecture sidebar. */
const ARCHITECTURE_SECTIONS = ['Principles', 'Compatibility', 'Reference'];

/** Section titles shown in the Hub sidebar. */
const HUB_SECTIONS = ['Registry'];

/** Section titles shown in the Blog sidebar. */
const BLOG_SECTIONS = ['History'];

/**
 * Filter navSections to show only docs-related sections.
 * Used by all /docs/ and /guide/ pages.
 */
export function filterDocsNav(navSections: { section: string }[]): { section: string }[] {
  return navSections.filter((s) => DOCS_SECTIONS.includes(s.section));
}

/**
 * Filter navSections to show only architecture-related sections.
 * Used by all /architecture/ and /engine/ pages.
 */
export function filterArchitectureNav(navSections: { section: string }[]): { section: string }[] {
  return navSections.filter((s) => ARCHITECTURE_SECTIONS.includes(s.section));
}

/**
 * Filter navSections to show only hub-related sections.
 * Used by all /hub/ and /registry/ pages.
 */
export function filterHubNav(navSections: { section: string }[]): { section: string }[] {
  return navSections.filter((s) => HUB_SECTIONS.includes(s.section));
}

/**
 * Filter navSections to show only blog-related sections.
 * Used by all /blog/ pages.
 */
export function filterBlogNav(navSections: { section: string }[]): { section: string }[] {
  return navSections.filter((s) => BLOG_SECTIONS.includes(s.section));
}

// Legacy aliases — keep existing route imports working.
export const filterFrameworkNav = filterDocsNav;
export const filterEngineNav = filterArchitectureNav;
export const filterRegistryNav = filterHubNav;
