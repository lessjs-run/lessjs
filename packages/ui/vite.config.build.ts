/**
 * @kiss/ui - Vite library mode build config
 * Pure ESM output, no CJS. Multi-entry for per-component imports.
 *
 * v0.5.0: components import Lit directly. @lessjs/core remains a
 * build/SSR framework package, not a Lit re-export layer.
 */
import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';

function jsrSelfTypes(): Plugin {
  return {
    name: 'kiss-ui-jsr-self-types',
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk' || !chunk.isEntry || !chunk.fileName.endsWith('.js')) {
          continue;
        }

        const fileName = chunk.fileName.split('/').pop();
        const declarationName = fileName?.replace(/\.js$/, '.d.ts');
        if (!declarationName) continue;

        chunk.code = `// @ts-self-types="./${declarationName}"\n${chunk.code}`;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist',
      include: ['src/**/*.ts'],
      tsconfigPath: './tsconfig.build.json',
    }),
    jsrSelfTypes(),
  ],
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'less-theme-toggle': 'src/less-theme-toggle.ts',
        'less-layout': 'src/less-layout.ts',
        'less-button': 'src/less-button.ts',
        'less-card': 'src/less-card.ts',
        'less-input': 'src/less-input.ts',
        'less-code-block': 'src/less-code-block.ts',
        'design-tokens': 'src/design-tokens.ts',
        'less-ui-plugin': 'src/less-ui-plugin.ts',
        'less-hero-ping': 'src/less-hero-ping.ts',
        'less-dialog': 'src/less-dialog.ts',
        'tokens/colors': 'src/tokens/colors.ts',
        'tokens/color-values': 'src/tokens/color-values.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'lit',
        'lit/',
        '@lit/reactive-element',
        'lit-html',
        'lit-element',
        'vite',
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
  },
});
