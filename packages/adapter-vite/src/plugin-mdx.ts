import type { Plugin } from 'vite';
import mdx from '@mdx-js/rollup';

export interface LessMdxPluginOptions {
  jsxImportSource?: string;
  development?: boolean;
}

export function mdxPlugin(options: LessMdxPluginOptions = {}): Plugin {
  const plugin = mdx({
    jsxImportSource: options.jsxImportSource ?? '@lessjs/core',
    providerImportSource: undefined,
    development: options.development ?? false,
  }) as Plugin;

  return {
    ...plugin,
    name: 'less:mdx',
    enforce: 'pre',
  };
}

export { mdxPlugin as lessMdx };
