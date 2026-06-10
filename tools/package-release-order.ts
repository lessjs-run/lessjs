export interface ReleasePackageStep {
  pkg: string;
  dir: string;
}

export const RELEASE_PACKAGE_ORDER: ReleasePackageStep[] = [
  { pkg: '@openelement/rpc', dir: 'packages/rpc' },
  { pkg: '@openelement/protocols', dir: 'packages/protocols' },
  { pkg: '@openelement/router', dir: 'packages/router' },
  { pkg: '@openelement/style-sheet', dir: 'packages/style-sheet' },
  { pkg: '@openelement/create', dir: 'packages/create' },
  { pkg: '@openelement/signals', dir: 'packages/signals' },
  { pkg: '@openelement/core', dir: 'packages/core' },
  { pkg: '@openelement/runtime', dir: 'packages/runtime' },
  { pkg: '@openelement/cem', dir: 'packages/cem' },
  { pkg: '@openelement/compat-check', dir: 'packages/compat-check' },
  { pkg: '@openelement/ssg', dir: 'packages/ssg' },
  { pkg: '@openelement/i18n', dir: 'packages/i18n' },
  { pkg: '@openelement/adapter-lit', dir: 'packages/adapter-lit' },
  { pkg: '@openelement/adapter-react', dir: 'packages/adapter-react' },
  { pkg: '@openelement/adapter-vanilla', dir: 'packages/adapter-vanilla' },
  { pkg: '@openelement/content', dir: 'packages/content' },
  { pkg: '@openelement/adapter-vite', dir: 'packages/adapter-vite' },
  { pkg: '@openelement/ui', dir: 'packages/ui' },
  { pkg: '@openelement/hub', dir: 'packages/hub' },
  { pkg: '@openelement/app', dir: 'packages/app' },
];
