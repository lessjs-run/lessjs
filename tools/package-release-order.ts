export interface ReleasePackageStep {
  pkg: string;
  dir: string;
}

export const RELEASE_PACKAGE_ORDER: ReleasePackageStep[] = [
  { pkg: '@openelement/protocols', dir: 'packages/protocols' },
  { pkg: '@openelement/router', dir: 'packages/router' },
  { pkg: '@openelement/create', dir: 'packages/create' },
  { pkg: '@openelement/signals', dir: 'packages/signals' },
  { pkg: '@openelement/core', dir: 'packages/core' },
  { pkg: '@openelement/elements', dir: 'packages/elements' },
  { pkg: '@openelement/i18n', dir: 'packages/i18n' },
  { pkg: '@openelement/content', dir: 'packages/content' },
  { pkg: '@openelement/adapter-vite', dir: 'packages/adapter-vite' },
  { pkg: '@openelement/ui', dir: 'packages/ui' },
  { pkg: '@openelement/app', dir: 'packages/app' },
];
