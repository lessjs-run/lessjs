import type { HeaderNavLink, NavSection } from '../types.ts';

export interface SearchIndexEntry {
  path: string;
  title: string;
  section: string;
  text: string;
}

export function writeSearchIndex(
  navSections: NavSection[],
  headerNav: HeaderNavLink[] = [],
): string {
  const entries = new Map<string, SearchIndexEntry>();
  const add = (entry: SearchIndexEntry) => {
    if (!entry.path.includes(':')) entries.set(entry.path, entry);
  };

  for (const section of navSections) {
    for (const item of section.items) {
      add({
        path: item.path,
        title: item.label,
        section: section.section || item.label,
        text: `${item.label} ${section.section}`.trim(),
      });
    }
  }

  for (const item of headerNav) {
    if (!entries.has(item.href)) {
      add({
        path: item.href,
        title: item.label,
        section: item.label,
        text: item.label,
      });
    }
  }

  return JSON.stringify([...entries.values()], null, 2) + '\n';
}
