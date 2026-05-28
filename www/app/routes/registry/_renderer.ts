/**
 * _renderer.ts - Layout renderer for the Registry section.
 *
 * v0.19.0: Injects vanilla JS search for the registry index page.
 * docs-registry-home is NOT an island, so Lit event handlers never
 * attach on the client. This script provides native search/filter.
 */

import type { LessRenderer } from '@lessjs/runtime';
import '../../islands/less-search.tsx';

const SEARCH_SCRIPT = `<script>
// Registry Hub - vanilla JS search (Lit component never hydrates on SSG pages)
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
// Registry Hub - iframe srcdoc + auto-resize (component detail pages, no Lit hydration)
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
