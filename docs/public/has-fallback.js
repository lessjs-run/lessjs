// LessJS Mobile Sidebar Manager — always-active
// Closes sidebar on backdrop click or nav link click (mobile).
// Uses composedPath() to penetrate Shadow DOM.
(function () {
  if (typeof document === 'undefined') return;

  // Helper: find the less-layout host from any element
  // @internal Reserved for future enhancement
  function _findLayoutHost(el) {
    let host = el.getRootNode ? el.getRootNode().host : null;
    while (host) {
      if (host.tagName === 'LESS-LAYOUT') return host;
      host = host.getRootNode ? host.getRootNode().host : null;
    }
    return document.querySelector('less-layout');
  }

  // Listen for backdrop clicks and nav link clicks
  document.addEventListener('click', function (e) {
    const target = e.target;
    if (!target || !(target instanceof Element)) return;

    const path = e.composedPath();
    let isBackdrop = false;
    let isNavLink = false;

    for (let i = 0; i < path.length; i++) {
      const el = path[i];
      if (!el.classList) continue;
      if (el.classList.contains('mobile-backdrop')) {
        isBackdrop = true;
        break;
      }
      if (el.tagName === 'A') {
        isNavLink = true;
        break;
      }
    }

    if (!isBackdrop && !isNavLink) return;

    // Close all mobile menus
    document.querySelectorAll('less-layout').forEach(function (el) {
      el.removeAttribute('menu-open');
    });
  });

  // When less-layout is defined, patch its toggle behavior
  const observer = new MutationObserver(function () {
    document.querySelectorAll('less-layout').forEach(function (el) {
      const sr = el.shadowRoot;
      if (sr) {
        const details = sr.querySelector('details.mobile-menu');
        if (details) {
          // Only attach if not already done
          if (!details.dataset.lessSidebar) {
            details.dataset.lessSidebar = '1';
            details.addEventListener('toggle', function () {
              if (this.open) el.setAttribute('menu-open', '');
              else el.removeAttribute('menu-open');
            });
          }
        }
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
