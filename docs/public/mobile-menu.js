// LessJS Mobile Sidebar — Universal handler (all browsers)
// Closes sidebar on backdrop click or nav link click (mobile).
// Uses composedPath() to penetrate Shadow DOM.
(function () {
  if (typeof document === 'undefined') return;

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

    // Close all mobile menus by removing menu-open attribute
    document.querySelectorAll('less-layout').forEach(function (el) {
      el.removeAttribute('menu-open');
      // Also sync the details element inside the shadow root
      const sr = el.shadowRoot;
      if (sr) {
        const details = sr.querySelector('details.mobile-menu');
        if (details) details.removeAttribute('open');
      }
    });
  });
})();
