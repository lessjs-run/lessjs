export interface RouteConfig {
  pattern: string;
  component: () => Promise<{ default: CustomElementConstructor }>;
  meta?: RouteMeta;
}

export interface RouteMeta {
  section?: string;
  label?: string;
  order?: number;
  dynamic?: boolean;
}

export function defineRoutes(routes: RouteConfig[]): RouteConfig[] {
  return routes;
}
