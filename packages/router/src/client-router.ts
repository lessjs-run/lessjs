import type { RouteConfig } from './define-routes.ts';

export function setupClientRouter(
  routes: RouteConfig[],
  onNavigate: (params: Record<string, string>) => void,
): AbortController {
  const ac = new AbortController();
  navigation.addEventListener('navigate', (e) => {
    const url = new URL(e.destination.url);
    for (const route of routes) {
      const pattern = new URLPattern({ pathname: route.pattern });
      const m = pattern.exec(url.pathname);
      if (m) {
        e.intercept({ handler: () => onNavigate(m.pathname.groups) });
        return;
      }
    }
  }, { signal: ac.signal });
  return ac;
}
