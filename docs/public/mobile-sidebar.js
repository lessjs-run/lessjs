// LessJS Mobile Sidebar — L2 (browser API)
// Closes sidebar on backdrop click or nav link click (mobile).
// Uses composedPath() to penetrate Shadow DOM.
if (typeof document !== 'undefined') {
  document.addEventListener('click', function (e) {
    const target = e.target;
    if (!target || !(target instanceof Element)) return;

    const path = e.composedPath();
    let isBackdrop = false;
    let isNavLink = false;

    for (let i = 0; i < path.length; i++) {
      const el = path[i];
      if (!el.classList) continue;
      if (el.classList.contains('mobile-backdrop')) isBackdrop = true;
      if (
        el.tagName === 'A' && (
          el.closest('.sidebar-nav') || el.closest('.nav-section')
        )
      ) isNavLink = true;
      if (isBackdrop || isNavLink) break;
    }

    if (!isBackdrop && !isNavLink) return;

    document.querySelectorAll('less-layout').forEach(function (el) {
      const sr = el.shadowRoot;
      if (sr) {
        const details = sr.querySelector('details.mobile-menu');
        if (details && details.open) details.removeAttribute('open');
      }
    });
  });
}
