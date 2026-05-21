/**
 * @lessjs/hub - Hub Search Index Builder
 *
 * v0.19.0: Build lightweight search indices from HubPackageRecord arrays.
 * Produces HubIndex instances that can be consumed by client-side search UIs.
 *
 * Search index is intentionally minimal - just enough metadata for
 * filtering and ranking without sending full package records to the client.
 */

import type { HubIndex, HubIndexEntry, HubPackageRecord } from './schema.ts';

// ─── Build Index ─────────────────────────────────────────────────────────

/**
 * Build a HubIndex from an array of HubPackageRecords.
 *
 * @param records - Array of full package records
 * @returns A lightweight search index
 */
export function buildIndex(records: HubPackageRecord[]): HubIndex {
  const packages: HubIndexEntry[] = records.map((r) => ({
    name: r.name,
    scope: r.scope,
    version: r.version,
    description: r.description || '',
    compatibility: r.compatibility,
    tags: r.tags.map((t) => t.tagName),
    source: r.source,
    safeToInstall: r.installGuidance.safeToInstall,
    ssrCapable: r.installGuidance.ssrCapable,
    submittedAt: r.submittedAt,
  }));

  return {
    schema: 'hub-index-v1',
    updatedAt: new Date().toISOString(),
    packages,
  };
}

// ─── Filter / Query Helpers ──────────────────────────────────────────────

/**
 * Filter index entries by compatibility tier.
 */
export function filterByCompatibility(
  entries: HubIndexEntry[],
  tier: string | null,
): HubIndexEntry[] {
  if (!tier || tier === 'all') return entries;
  return entries.filter((e) => e.compatibility === tier);
}

/**
 * Filter index entries by search query (name, scope, tags).
 * Simple substring matching - suitable for client-side use.
 */
export function searchPackages(
  entries: HubIndexEntry[],
  query: string,
): HubIndexEntry[] {
  if (!query || query.length < 2) return entries;

  const q = query.toLowerCase();
  return entries.filter((e) => {
    const fullName = e.scope ? `${e.scope}/${e.name}` : e.name;
    if (fullName.toLowerCase().includes(q)) return true;
    if (e.description?.toLowerCase().includes(q)) return true;
    for (const tag of e.tags) {
      if (tag.toLowerCase().includes(q)) return true;
    }
    return false;
  });
}

/**
 * Sort index entries by name (alphabetical).
 */
export function sortEntries(
  entries: HubIndexEntry[],
): HubIndexEntry[] {
  return [...entries].sort((a, b) => {
    const aName = a.scope ? `${a.scope}/${a.name}` : a.name;
    const bName = b.scope ? `${b.scope}/${b.name}` : b.name;
    return aName.localeCompare(bName);
  });
}
