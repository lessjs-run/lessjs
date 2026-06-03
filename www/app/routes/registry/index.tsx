/**
 * Registry Hub - Package Search &amp; List
 *
 * v0.19.0: Browse and search validated Web Component packages.
 * Data is embedded during SSG via JSON import, no client-side fetch needed.
 * v0.29: Signal-driven filtering/sorting — zero manual state, zero inline handlers.
 *
 * @see docs/sop/v0.19.0-platform-hub.md
 * @see ADR-0030
 */

export const meta = { section: 'Registry', label: 'Package Registry', order: 5 };

import { DsdElement } from '@lessjs/core';
import { signal, computed } from '@lessjs/signals';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import hubData from '../../data/registry/hub-index.ts';
import type { HubIndexData, HubIndexEntry } from '../../data/registry/hub-index.ts';

export const tagName = 'docs-registry-home';

const COMPAT_LABELS: Record<string, string> = {
  'ssr-capable': 'SSR Capable',
  'client-only': 'Client Only',
  'rejected': 'Rejected',
  'experimental-dom': 'Experimental DOM',
};
const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .registry-header {
        margin-bottom: var(--size-8);
      }

      .registry-header h1 {
        font-size: var(--font-size-4);
        font-weight: var(--font-weight-7);
        margin: 0 0 0.5rem;
      }

      .registry-header p {
        color: var(--gray-7);
        margin: 0;
        font-size: 0.9375rem;
      }

      .badge-early-access {
        display: inline-block;
        font-size: 0.625rem;
        font-weight: var(--font-weight-6);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.15em 0.5em;
        border-radius: var(--radius-1);
        background: var(--indigo-1);
        color: var(--indigo-5);
        vertical-align: middle;
        margin-left: 0.5rem;
      }

      .early-access-note {
        margin-top: 0.5rem !important;
        font-size: 0.8125rem !important;
        font-style: italic;
      }

      .early-access-note a {
        color: var(--indigo-5);
        text-decoration: underline;
      }

      /* Controls */
      .controls {
        display: flex;
        gap: var(--size-4);
        align-items: center;
        margin-bottom: var(--size-6);
        flex-wrap: wrap;
      }

      .search-box {
        flex: 1;
        min-width: 200px;
        padding: 0.625rem 0.875rem;
        border: 0.5px solid var(--gray-3);
        border-radius: 6px;
        background: var(--gray-1);
        color: var(--gray-10);
        font-size: var(--font-size-0);
        outline: none;
        transition: border-color 0.15s;
      }

      .search-box:focus {
        border-color: var(--indigo-5);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--indigo-5) 15%, transparent)), var(--shadow-glow, 0 0 20px rgba(83,74,183,0.15));
      }

      .search-box::placeholder {
        color: var(--gray-6);
      }

      .filter-group {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
      }

      .sort-select {
        padding: 0.375rem 0.5rem;
        border: 0.5px solid var(--gray-3);
        border-radius: 14px;
        background: transparent;
        color: var(--gray-7);
        font-size: var(--font-size-00);
        cursor: pointer;
      }

      .filter-btn {
        padding: 0.375rem 0.75rem;
        border: 0.5px solid var(--gray-3);
        border-radius: 14px;
        background: transparent;
        color: var(--gray-7);
        font-size: var(--font-size-00);
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }

      .filter-btn:hover {
        border-color: var(--gray-4);
        color: var(--gray-10);
      }

      .filter-btn.active {
        background: var(--indigo-5);
        border-color: var(--indigo-5);
        color: white;
      }

      /* Stats */
      .stats {
        font-size: 0.8125rem;
        color: var(--gray-6);
        margin-bottom: var(--size-4);
      }

      /* Package List */
      .package-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--size-4);
      }

      .package-card {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: var(--size-5);
        border: 1px solid var(--gray-3);
        border-radius: 10px;
        background: var(--gray-1);
        box-shadow: var(--shadow-1);
        transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        cursor: pointer;
        text-decoration: none;
        color: inherit;
      }

      .package-card:hover {
        border-color: var(--indigo-5);
        box-shadow: 0 4px 20px color-mix(in srgb, var(--indigo-5) 15%, transparent);
        transform: translateY(-3px);
      }

      .package-info {
        flex: 1;
        min-width: 0;
      }

      .package-name {
        font-size: var(--font-size-1);
        font-weight: var(--font-weight-6);
        margin: 0 0 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .package-name code {
        font-size: var(--font-size-0);
        background: var(--gray-2);
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
      }

      .package-version {
        font-size: var(--font-size-00);
        color: var(--gray-6);
        font-weight: var(--font-weight-4);
      }

      .package-desc {
        font-size: 0.8125rem;
        color: var(--gray-7);
        margin: 0.25rem 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .package-meta {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 0.375rem;
      }

      .compat-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.125rem 0.5rem;
        border-radius: 10px;
        font-size: 0.6875rem;
        font-weight: var(--font-weight-5);
        white-space: nowrap;
      }

      /* Compat status colors */
      .compat-badge-ssr-capable { background: color-mix(in srgb, var(--green-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--green-6) 25%, transparent); }
      .compat-badge-client-only { background: color-mix(in srgb, var(--orange-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--orange-6) 25%, transparent); }
      .compat-badge-rejected { background: color-mix(in srgb, var(--red-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--red-6) 25%, transparent); }
      .compat-badge-experimental-dom { background: color-mix(in srgb, var(--blue-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--blue-6) 25%, transparent); }
      .compat-badge-default { background: color-mix(in srgb, var(--gray-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--gray-6) 25%, transparent); }

      .compat-dot-ssr-capable { background: var(--green-6); }
      .compat-dot-client-only { background: var(--orange-6); }
      .compat-dot-rejected { background: var(--red-6); }
      .compat-dot-experimental-dom { background: var(--blue-6); }
      .compat-dot-default { background: var(--gray-6); }

      .compat-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        display: inline-block;
      }

      .tag-pill {
        display: inline-block;
        padding: 0.0625rem 0.375rem;
        background: var(--gray-2);
        border-radius: 3px;
        font-size: 0.6875rem;
        color: var(--gray-6);
      }

      .install-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.6875rem;
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
      }

      .install-safe {
        background: color-mix(in srgb, var(--green-6) 10%, transparent);
        color: var(--green-6);
      }

      .install-unsafe {
        background: color-mix(in srgb, var(--red-6) 10%, transparent);
        color: var(--red-6);
      }

      .new-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.625rem;
        font-weight: var(--font-weight-6);
        padding: 0.0625rem 0.375rem;
        border-radius: 6px;
        background: color-mix(in srgb, var(--blue-6) 10%, transparent);
        color: var(--blue-6);
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .component-breakdown {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.6875rem;
        color: var(--gray-6);
      }

      .breakdown-segment {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }

      .breakdown-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        display: inline-block;
      }

      .empty-state {
        text-align: center;
        padding: var(--size-12) var(--size-4);
        color: var(--gray-6);
        font-size: 0.9375rem;
      }

      @media (max-width: 640px) {
        .controls {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `);

export default class DocsRegistryHome extends DsdElement {
  #query = signal('');
  #tierFilter = signal('all');
  #sortBy = signal<'name' | 'tags' | 'compatibility'>('name');
  #packages: HubIndexEntry[] = [];
  #filtered = computed(() => this._computeFiltered());

  static override styles = [openPropsTokenSheet, routeSheet];

  constructor() {
    super();
    const index = hubData as HubIndexData;
    if (index?.packages) {
      this.#packages = index.packages;
    }
    this.registerSignal('query', this.#query);
    this.registerSignal('tierFilter', this.#tierFilter);
    this.registerSignal('sortBy', this.#sortBy);
  }

  private _computeFiltered(): HubIndexEntry[] {
    let result = [...this.#packages];

    const q = this.#query.value.toLowerCase();
    if (q.length >= 2) {
      result = result.filter((p) => {
        const fullName = p.scope ? `${p.scope}/${p.name}` : p.name;
        if (fullName.toLowerCase().includes(q)) return true;
        if (p.description?.toLowerCase().includes(q)) return true;
        for (const tag of p.tags) {
          if (tag.toLowerCase().includes(q)) return true;
        }
        return false;
      });
    }

    if (this.#tierFilter.value !== 'all') {
      result = result.filter((p) => p.compatibility === this.#tierFilter.value);
    }

    result.sort((a, b) => {
      switch (this.#sortBy.value) {
        case 'tags':
          return b.tags.length - a.tags.length;
        case 'compatibility': {
          const order: Record<string, number> = {
            'ssr-capable': 0,
            'client-only': 1,
            'experimental-dom': 2,
            'rejected': 3,
          };
          return (order[a.compatibility] ?? 9) - (order[b.compatibility] ?? 9);
        }
        default: {
          const aName = a.scope ? `${a.scope}/${a.name}` : a.name;
          const bName = b.scope ? `${b.scope}/${b.name}` : b.name;
          return aName.localeCompare(bName);
        }
      }
    });

    return result;
  }

  /** data-on-input handler for search box */
  _onSearchInput(e: Event): void {
    this.#query.value = (e.target as HTMLInputElement).value;
  }

  /** data-on-click handler for filter buttons (reads dataset.filter) */
  _onFilterClick(e: Event): void {
    this.#tierFilter.value = (e.currentTarget as HTMLElement).dataset.filter || 'all';
  }

  /** data-on-change handler for sort select */
  _onSortChange(e: Event): void {
    this.#sortBy.value = (e.target as HTMLSelectElement).value as 'name' | 'tags' | 'compatibility';
  }

  private _packageLink(pkg: HubIndexEntry): string {
    const name = pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name;
    return `/registry/${name.replace('/', '~')}`;
  }

  override render() {
    const q = this.#query.value;
    const tier = this.#tierFilter.value;
    const sort = this.#sortBy.value;
    const filtered = this.#filtered.value;
    const loading = this.#packages.length === 0;

    return (
      
        <div class="container">
          <div class="registry-header">
            <h1>Registry Hub <span class="badge-early-access">Early Access</span></h1>
            <p>
              Discover validated Web Component packages. Each package includes compatibility evidence,
              installation guidance, and snapshot previews.
            </p>
            <p class="early-access-note">
              Currently indexing 3 packages. Actively onboarding more Web Components libraries.
              <a href="https://github.com/lessjs-run/lessjs/issues?q=label%3Ahub-submit">Submit your package {'->'}</a>
            </p>
          </div>

          <div class="controls">
            <input
              class="search-box"
              type="text"
              placeholder="Search by name, tag, or description..."
              data-on-input="_onSearchInput"
            />
            <div class="filter-group">
              <button class={`filter-btn ${tier === 'all' ? 'active' : ''}`} data-on-click="_onFilterClick" data-filter="all" type="button">All</button>
              <button class={`filter-btn ${tier === 'ssr-capable' ? 'active' : ''}`} data-on-click="_onFilterClick" data-filter="ssr-capable" type="button">SSR &#10003;</button>
              <button class={`filter-btn ${tier === 'client-only' ? 'active' : ''}`} data-on-click="_onFilterClick" data-filter="client-only" type="button">Client</button>
              <button class={`filter-btn ${tier === 'rejected' ? 'active' : ''}`} data-on-click="_onFilterClick" data-filter="rejected" type="button">Rejected</button>
            </div>
            <select class="sort-select" data-on-change="_onSortChange">
              <option value="name" selected={sort === 'name'}>Sort: Name</option>
              <option value="tags" selected={sort === 'tags'}>Sort: Components</option>
              <option value="compatibility" selected={sort === 'compatibility'}>Sort: Compatibility</option>
            </select>
          </div>

          {loading
            ? <div class="empty-state">Loading registry...</div>
            : filtered.length === 0
            ? <div class="empty-state">
                {q || tier !== 'all'
                  ? 'No packages match your search criteria.'
                  : 'No packages in the registry yet.'}
              </div>
            : <>
              <div class="stats">{filtered.length} package{filtered.length !== 1 ? 's' : ''} found</div>

              <div class="package-list">
                {filtered.map((pkg) => {
                  const fullName = pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name;
                  const compatLabel = COMPAT_LABELS[pkg.compatibility] || pkg.compatibility;
                  const compatClass = pkg.compatibility || 'default';

                  const submittedDate = new Date(pkg.submittedAt);
                  const daysSinceSubmit = (Date.now() - submittedDate.getTime()) /
                    (1000 * 60 * 60 * 24);
                  const isNew = daysSinceSubmit < 7;

                  const totalTags = pkg.tags.length;
                  const ssrCount = pkg.ssrCapable ? totalTags : 0;
                  const clientCount = totalTags - ssrCount;

                  return (
                    <a class="package-card" href={this._packageLink(pkg)} data-compat={pkg.compatibility}>
                      <div class="package-info">
                        <div class="package-name">
                          <code>{fullName}</code>
                          <span class="package-version">v{pkg.version}</span>
                          {isNew && <span class="new-badge">New</span>}
                        </div>
                        <div class="package-desc">{pkg.description || 'No description'}</div>
                        <div class="package-meta">
                          <span class={`compat-badge compat-badge-${compatClass}`}>
                            <span class={`compat-dot compat-dot-${compatClass}`}></span>
                            {compatLabel}
                          </span>
                          <span class={`install-badge ${pkg.safeToInstall ? 'install-safe' : 'install-unsafe'}`}>
                            {pkg.safeToInstall ? '\u2705 Safe install' : '\u274C Not installable'}
                          </span>
                          <span class="component-breakdown">
                            {ssrCount > 0 && (
                              <span class="breakdown-segment">
                                <span class="breakdown-dot" style="background:var(--green-6)"></span>{ssrCount} SSR
                              </span>
                            )}
                            {ssrCount > 0 && clientCount > 0 ? ' ' : ''}
                            {clientCount > 0 && (
                              <span class="breakdown-segment">
                                <span class="breakdown-dot" style="background:var(--orange-6)"></span>{clientCount} client
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </>}
        </div>
      
    );
  }
}

// Guard against duplicate define
if (!customElements.get(tagName)) {
  customElements.define(tagName, DocsRegistryHome);
}
