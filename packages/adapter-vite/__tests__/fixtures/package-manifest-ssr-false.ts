/**
 * Fixture: Package manifest with ssr: false declaration
 *
 * This mock package manifest declares a component with ssr: false.
 * The SSR admission plan should treat it as client-only.
 */

import type { LessPackageManifest } from '@lessjs/core';

export const manifest: LessPackageManifest = {
  packageName: '@test/package-island-ssr-false',
  declarations: [
    {
      tagName: 'package-ssr-false',
      less: {
        module: './dist/package-island-ssr-false.js',
        ssr: false,
        dsd: false,
        hydrate: 'lazy',
      },
    },
  ],
};
