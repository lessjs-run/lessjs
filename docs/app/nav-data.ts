/**
 * KISS Docs navigation data.
 *
 * Keep the first screen of the docs opinionated: readers should understand
 * what KISS is, when to use it, and which mental model to carry forward.
 */

export interface NavItem {
  path: string;
  label: string;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export interface HeaderNavItem {
  href: string;
  label: string;
}

export const SIDEBAR_NAV: NavSection[] = [
  {
    section: 'Start Here',
    items: [
      { path: '/guide/positioning', label: 'Framework Positioning' },
      { path: '/guide/getting-started', label: 'Getting Started' },
      { path: '/guide/design-philosophy', label: 'Design Philosophy' },
      { path: '/guide/architecture', label: 'Architecture' },
    ],
  },
  {
    section: 'Core Model',
    items: [
      { path: '/guide/routing', label: 'Routing' },
      { path: '/guide/ssg', label: 'Rendering & SSG' },
      { path: '/guide/islands', label: 'Island Upgrade' },
      { path: '/guide/api-routes', label: 'API Routes' },
      { path: '/guide/api-design', label: 'API Design' },
    ],
  },
  {
    section: 'Production',
    items: [
      { path: '/guide/configuration', label: 'Configuration' },
      { path: '/guide/security-middleware', label: 'Security & Middleware' },
      { path: '/guide/error-handling', label: 'Error Handling' },
      { path: '/guide/testing', label: 'Testing' },
      { path: '/guide/deployment', label: 'Deployment' },
    ],
  },
  {
    section: 'Packages',
    items: [
      { path: '/ui', label: 'Design System' },
      { path: '/styling/kiss-ui', label: '@kissjs/ui' },
      { path: '/styling/web-awesome', label: 'Web Awesome' },
      { path: '/examples', label: 'Examples' },
    ],
  },
  {
    section: 'Strategy',
    items: [
      { path: '/roadmap', label: 'Roadmap' },
      { path: '/guide/kiss-compiler', label: '.kiss Compiler' },
      { path: '/guide/pwa', label: 'PWA Support' },
      { path: '/guide/blog-system', label: 'Blog System' },
      { path: '/decisions', label: 'Architecture Decisions' },
    ],
  },
  {
    section: 'Examples',
    items: [
      { path: '/demo', label: 'Live Demo' },
      { path: '/examples/hello', label: 'Hello World' },
      { path: '/examples/minimal-blog', label: 'Minimal Blog' },
      { path: '/examples/fullstack', label: 'Fullstack' },
    ],
  },
  {
    section: 'History',
    items: [
      { path: '/blog', label: 'Blog' },
      { path: '/blog/v0-5-alpha1', label: 'v0.5 Alpha 1' },
      { path: '/blog/v0-5-0', label: 'v0.5.0' },
      { path: '/blog/v0-4-0', label: 'v0.4.0' },
      { path: '/blog/kiss-compiler', label: '.kiss Compiler Note' },
      { path: '/changelog', label: 'Changelog' },
      { path: '/contributing', label: 'Contributing' },
    ],
  },
];

export const HEADER_NAV: HeaderNavItem[] = [
  { href: '/guide/positioning', label: 'Docs' },
  { href: '/guide/architecture', label: 'Architecture' },
  { href: '/examples', label: 'Examples' },
  { href: '/ui', label: 'UI' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: 'https://jsr.io/@kissjs/core', label: 'JSR' },
];
