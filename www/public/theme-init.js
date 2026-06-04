// openElement Theme Initialization - L2 (browser API)
// Runs before page render to prevent FOUC (Flash of Unstyled Content).
// Reads saved theme from localStorage or prefers-color-scheme.
// Default: light theme (white background, black text).
// v0.19.1 Phase 6: Added CSS transition for theme switching (ADR-0035 B4).
(function () {
  if (typeof document === 'undefined') return;

  // Kill any stale service workers/caches that could serve old blank HTML
  try {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister().catch(() => {}));
      }).catch(() => {});
    }
    if (globalThis.caches?.keys) {
      caches.keys().then((keys) => {
        keys.filter((k) => k.startsWith('open-')).forEach((k) => caches.delete(k).catch(() => {}));
      }).catch(() => {});
    }
  } catch { /* ignore */ }

  // --- Helpers -----------------------------------------------------------
  const uncloak = () => {
    // Make sure page is visible even if theme detection fails
    document.documentElement.style.visibility = 'visible';
    const cloak = document.getElementById('open-anti-flash');
    if (cloak) cloak.remove();
  };

  let saved;
  try {
    saved = localStorage.getItem('open-theme');
  } catch {
    // localStorage may be blocked in private browsing or restricted contexts
  }

  let prefersDark = false;
  try {
    prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  } catch {
    // matchMedia may be unavailable in old WebViews
  }

  // Match open-theme-toggle default: dark when no preference saved
  const theme = saved || (prefersDark ? 'dark' : 'dark');
  try {
    document.documentElement.setAttribute('data-theme', theme);
    // Add smooth theme transition (deferred to avoid FOUC)
    requestAnimationFrame(function () {
      document.documentElement.style.setProperty(
        'transition',
        'background-color 0.3s ease, color 0.3s ease',
      );
      uncloak();
    });
  } catch {
    uncloak();
  }

  // Fallback: ensure the cloak is removed even if everything above fails.
  setTimeout(uncloak, 500);
})();
