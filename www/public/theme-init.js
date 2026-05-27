// LessJS Theme Initialization — L2 (browser API)
// Runs before page render to prevent FOUC (Flash of Unstyled Content).
// Reads saved theme from localStorage or prefers-color-scheme.
// Default: light theme (white background, black text).
// v0.19.1 Phase 6: Added CSS transition for theme switching (ADR-0035 B4).
(function () {
  if (typeof document === 'undefined') return;
  let saved;
  let prefersDark = false;
  try {
    saved = localStorage.getItem('less-theme');
  } catch {
    // localStorage may be blocked in private browsing or restricted contexts
  }
  try {
    prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  } catch {
    // matchMedia may be unavailable in old WebViews
  }
  // Match less-theme-toggle default: dark when no preference saved
  const theme = saved || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  // Add smooth theme transition (deferred to avoid FOUC)
  requestAnimationFrame(function () {
    document.documentElement.style.setProperty(
      'transition',
      'background-color 0.3s ease, color 0.3s ease',
    );
  });
  // Remove anti-flash cloak — done before first paint
  const cloak = document.getElementById('less-anti-flash');
  if (cloak) cloak.remove();
})();
