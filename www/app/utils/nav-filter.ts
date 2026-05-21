/**
 * nav-filter.ts - Sidebar navigation filtering utilities.
 *
 * The `less-layout` component renders all navItems without filtering.
 * These functions allow route components to pass only relevant navSections
 * to the sidebar, so framework pages show Quick Start / Core / Production
 * and engine pages show Principles / Compatibility / Reference.
 */

/** Section titles shown in the framework sidebar. */
const FRAMEWORK_SECTIONS = ['Quick Start', 'Core', 'Production'];

/** Section titles shown in the engine sidebar. */
const ENGINE_SECTIONS = ['Principles', 'Compatibility', 'Reference'];

/**
 * Filter navSections to show only framework-related sections.
 * Used by all /guide/ pages.
 */
export function filterFrameworkNav(navSections: { section: string }[]): { section: string }[] {
  return navSections.filter((s) => FRAMEWORK_SECTIONS.includes(s.section));
}

/**
 * Filter navSections to show only engine-related sections.
 * Used by all /engine/ pages.
 */
export function filterEngineNav(navSections: { section: string }[]): { section: string }[] {
  return navSections.filter((s) => ENGINE_SECTIONS.includes(s.section));
}

/** Section titles shown in the registry sidebar. */
const REGISTRY_SECTIONS = ['Registry'];

/** Section titles shown in the blog sidebar. */
const BLOG_SECTIONS = ['History'];

/**
 * Filter navSections to show only registry-related sections.
 * Used by all /registry/ pages.
 */
export function filterRegistryNav(navSections: { section: string }[]): { section: string }[] {
  return navSections.filter((s) => REGISTRY_SECTIONS.includes(s.section));
}

/**
 * Filter navSections to show only blog-related sections.
 * Used by all /blog/ pages.
 */
export function filterBlogNav(navSections: { section: string }[]): { section: string }[] {
  return navSections.filter((s) => BLOG_SECTIONS.includes(s.section));
}
