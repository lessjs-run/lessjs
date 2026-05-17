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

const renderer: LessRenderer = {
  wrap(html: string, ctx: { req: { path: string } }) {
    // Only inject search script on the registry index page
    const path = ctx.req.path || '';
    if (path === '/registry' || path === '/registry/' || path === '/en/registry' || path === '/en/registry/') {
      return html + SEARCH_SCRIPT;
    }
    return html;
  },
};

export default renderer;
