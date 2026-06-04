/**
 * Fixture: Package manifest with ssr: false declaration
 *
 * This mock package manifest declares a component with ssr: false.
 * The SSR admission plan should treat it as client-only.
 */

import type { LessPackageManifest } from '@openelement/core';

export const manifest: LessPackageManifest = {
  packageName: '@test/package-island-ssr-false',
  schemaVersion: '1.0.0',
  version: '0.0.1',
  declarations: [
    {
      tagName: 'package-ssr-false',
      less: {
        module: './dist/package-island-ssr-false.js',
        ssr: false,
        dsd: false,
        hydrate: 'idle',
      },
    },
  ],
};
