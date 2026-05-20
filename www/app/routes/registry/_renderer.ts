/**
 * _renderer.ts — Layout renderer for the Registry section.
 *
 * v0.19.0: Injects vanilla JS search for the registry index page.
 * docs-registry-home is NOT an island, so Lit event handlers never
 * attach on the client. This script provides native search/filter.
 */

import type { LessRenderer } from '@lessjs/core';

const SEARCH_SCRIPT = `<script>
// Registry Hub — vanilla JS search (Lit component never hydrates on SSG pages)
(function() {
  var DEBOUNCE, ROOT;

  function init() {
    ROOT = document.querySelector('docs-registry-home');
    if (!ROOT) return setTimeout(init, 50);
    var sr = ROOT.shadowRoot || ROOT;
    var input = sr.querySelector('.search-box');
    var btns = sr.querySelectorAll('.filter-btn');
    var cards = sr.querySelectorAll('.package-card');
    var stats = sr.querySelector('.stats');
    if (!input || !cards.length) return setTimeout(init, 100);

    function filter() {
      var q = input.value.toLowerCase();
      var active = sr.querySelector('.filter-btn.active');
      var tier = 'all';
      if (active) {
        var t = active.textContent.replace(/[\\u2713]/g,'').trim().toLowerCase();
        if (t === 'ssr') tier = 'ssr-capable';
        else if (t === 'client') tier = 'client-only';
        else if (t === 'rejected') tier = 'rejected';
      }
      var visible = 0;
      cards.forEach(function(c) {
        var nameEl = c.querySelector('code');
        var descEl = c.querySelector('.package-desc');
        var name = nameEl ? nameEl.textContent.toLowerCase() : '';
        var desc = descEl ? descEl.textContent.toLowerCase() : '';
        var match = true;
        if (q.length >= 2) {
          match = name.indexOf(q) !== -1 || desc.indexOf(q) !== -1;
        }
        if (match && (tier === 'all' || c.dataset.compat === tier)) {
          c.style.display = '';
          visible++;
        } else {
          c.style.display = 'none';
        }
      });
      if (stats) stats.textContent = visible + ' package' + (visible !== 1 ? 's' : '') + ' found';
    }

    input.addEventListener('input', function() {
      clearTimeout(DEBOUNCE);
      DEBOUNCE = setTimeout(filter, 150);
    });
    btns.forEach(function(b) {
      b.addEventListener('click', function() {
        btns.forEach(function(x) { x.classList.remove('active'); });
        b.classList.add('active');
        filter();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
<\/script>`;

const IFRAME_RESIZE_SCRIPT = `<script>
// Registry Hub — iframe srcdoc + auto-resize (component detail pages, no Lit hydration)
// Lit SSR cannot serialize .srcdoc or srcdoc= correctly for complex HTML content,
// so we store the srcdoc as Base64 in data-srcdoc and decode it client-side.
(function() {
  function init() {
    var el = document.querySelector('docs-registry-component-detail');
    if (!el) return;
    var sr = el.shadowRoot || el;
    var iframes = sr.querySelectorAll('.preview-iframe[data-srcdoc]');
    iframes.forEach(function(iframe) {
      try {
        iframe.srcdoc = atob(iframe.dataset.srcdoc);
      } catch(e) {
        iframe.srcdoc = iframe.dataset.srcdoc;
      }
      iframe.removeAttribute('data-srcdoc');
      iframe.addEventListener('load', function() {
        try {
          var doc = iframe.contentDocument;
          if (doc && doc.body) {
            iframe.style.height = doc.body.scrollHeight + 32 + 'px';
          }
        } catch(e) {}
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
<\/script>`;

const renderer: LessRenderer = {
  wrap(html: string, ctx: { req: { path: string } }) {
    const path = ctx.req.path || '';

    // Inject search button CSS into header slot with DSD
    // DSD only contains styles — Lit renders the button in less-search.ts
    const SEARCH_DSD = '<less-search slot="header-actions"><template shadowrootmode="open"><style>:host{display:inline-flex;align-items:center}.search-trigger{display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.5rem;border:0.5px solid var(--less-border);border-radius:6px;background:transparent;color:var(--less-text-muted);font-size:0.6875rem;font-weight:500;letter-spacing:0.02em;cursor:pointer;transition:color 150ms ease-out,border-color 150ms ease-out}.search-trigger:hover{color:var(--less-text-secondary);border-color:var(--less-border-hover)}.search-trigger kbd{font-family:inherit;padding:0.0625rem 0.3125rem;border:0.5px solid var(--less-border);border-radius:3px;font-size:0.625rem;margin-left:0.25rem}.search-icon{display:none;width:16px;height:16px}@media(max-width:640px){.search-trigger span{display:none}.search-trigger kbd{display:none}.search-icon{display:inline-block}.search-trigger{padding:0.375rem}}</style></template></less-search>';
    const layoutOpen = html.indexOf('<less-layout');
    if (layoutOpen >= 0) {
      const closeGt = html.indexOf('>', layoutOpen);
      if (closeGt > 0) {
        html = html.slice(0, closeGt + 1) +
          SEARCH_DSD +
          html.slice(closeGt + 1);
      }
    }

    // Inject search script on the registry index page
    if (
      path === '/registry' || path === '/registry/' || path === '/en/registry' ||
      path === '/en/registry/'
    ) {
      return html + SEARCH_SCRIPT;
    }

    // Inject iframe resize script on component detail pages
    if (path.indexOf('/registry/') !== -1 && path.split('/').length > 3) {
      return html + IFRAME_RESIZE_SCRIPT;
    }

    return html;
  },
};

export default renderer;
