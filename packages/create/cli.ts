/**
 * @lessjs/create - Minimal project scaffold for LessJS framework.
 *
 * Usage: deno run -A jsr:@lessjs/create my-app
 *
 * LessJS Architecture: Keep It Simple, Stupid.
 * One template, zero prompts, instant start.
 */

import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const TPL = {
  '.gitignore': `.less/
dist/
node_modules/
`,
  'deno.json': `{
  "imports": {
    "lit": "npm:lit@^3.2.0",
    "@lit/reactive-element": "npm:@lit/reactive-element@^2",
    "lit-element": "npm:lit-element@^4",
    "lit-html": "npm:lit-html@^3",
    "vite": "npm:vite@8.0.10",
    "@lessjs/adapter-lit": "jsr:@lessjs/adapter-lit@^0.3.0",
    "@lessjs/core": "jsr:@lessjs/core@^0.6.0",
    "@lessjs/core/less-runtime": "jsr:@lessjs/core@^0.6.0/less-runtime",
    "@lessjs/ui": "jsr:@lessjs/ui@^0.6.0",
    "@lessjs/ui/tokens/colors": "jsr:@lessjs/ui@^0.6.0/tokens/colors",
    "@lessjs/ui/tokens/color-values": "jsr:@lessjs/ui@^0.6.0/tokens/color-values",
    "@lessjs/ui/": "jsr:@lessjs/ui@^0.6.0/"
  },
  "nodeModulesDir": "auto",
  "tasks": {
    "dev": "deno run --config deno.json -A npm:vite",
    "build": "deno run --config deno.json -A jsr:@lessjs/core/cli/build",
    "build:ssr": "deno run --config deno.json -A npm:vite build",
    "build:client": "deno run --config deno.json -A jsr:@lessjs/core/cli/build-client",
    "build:ssg": "deno run --config deno.json -A jsr:@lessjs/core/cli/build-ssg",
    "preview": "deno run --config deno.json -A npm:vite preview"
  },
  "compilerOptions": { "lib": ["ES2022", "DOM", "DOM.Iterable"] }
}
`,
  'vite.config.ts': `import { less } from '@lessjs/core';
import { lessRootColorCSS } from '@lessjs/ui/tokens/colors';
import { defineConfig } from 'vite';

// DRY: All color token values come from @lessjs/ui/tokens/colors.ts
// (single source of truth). Do NOT hand-write color values here.
const colorTokensStyle = '<style>' + lessRootColorCSS + 'body{margin:0;background:var(--less-bg-base);color:var(--less-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>';

const lessUiAliases = {
  '@lessjs/ui': 'https://jsr.io/@lessjs/ui/0.6.0/src/index.ts',
  '@lessjs/ui/design-tokens': 'https://jsr.io/@lessjs/ui/0.6.0/src/design-tokens.ts',
  '@lessjs/ui/less-button': 'https://jsr.io/@lessjs/ui/0.6.0/src/less-button.ts',
  '@lessjs/ui/less-card': 'https://jsr.io/@lessjs/ui/0.6.0/src/less-card.ts',
  '@lessjs/ui/less-code-block': 'https://jsr.io/@lessjs/ui/0.6.0/src/less-code-block.ts',
  '@lessjs/ui/less-dialog': 'https://jsr.io/@lessjs/ui/0.6.0/src/less-dialog.ts',
  '@lessjs/ui/less-hero-ping': 'https://jsr.io/@lessjs/ui/0.6.0/src/less-hero-ping.ts',
  '@lessjs/ui/less-input': 'https://jsr.io/@lessjs/ui/0.6.0/src/less-input.ts',
  '@lessjs/ui/less-layout': 'https://jsr.io/@lessjs/ui/0.6.0/src/less-layout.ts',
  '@lessjs/ui/less-theme-toggle': 'https://jsr.io/@lessjs/ui/0.6.0/src/less-theme-toggle.ts',
  '@lessjs/ui/less-ui-plugin': 'https://jsr.io/@lessjs/ui/0.6.0/src/less-ui-plugin.ts',
  '@lessjs/ui/tokens/colors': 'https://jsr.io/@lessjs/ui/0.6.0/src/tokens/colors.ts',
  '@lessjs/ui/tokens/color-values': 'https://jsr.io/@lessjs/ui/0.6.0/src/tokens/color-values.ts',
};

export default defineConfig({
  resolve: {
    alias: lessUiAliases,
  },
  plugins: [less({
    html: { title: 'My LessJS App' },
    // Use pre-built UI components from @lessjs/ui
    // (JSR distributes compiled JS - no decorator errors)
    packageIslands: ['@lessjs/ui'],
    // SSR must bundle @lessjs/ui (decorators need compilation)
    ssr: {
      noExternal: ['@lessjs/ui'],
    },
    inject: {
      headFragments: [
        // Design tokens - DRY: values from @lessjs/ui/tokens/colors.ts
        colorTokensStyle,
      ],
    },
  })],
});
`,
  'app/routes/index.ts': `import { css, html, LitElement } from 'lit';

export const tagName = 'home-page';
export default class HomePage extends LitElement {
  static override styles = css\`
    :host { display: block; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { color: var(--less-text-secondary, #666); }
    \`;

  override render() {
    return html\`
      <h1>Hello from LessJS!</h1>
      <p>Your LessJS app is running. Edit <code>app/routes/index.ts</code> to get started.</p>
      <my-counter></my-counter>
    \`;
  }
}
`,
  'app/islands/my-counter.ts': `import { css, html, LitElement } from 'lit';

export const tagName = 'my-counter';

export default class MyCounter extends LitElement {
  static override styles = css\`
    :host { display: inline-flex; gap: 0.5rem; align-items: center; margin-top: 1rem; }
    button { padding: 0.25rem 0.75rem; cursor: pointer; }
  \`;

  static override properties = { count: { type: Number } };

  declare count: number;

  constructor() {
    super();
    this.count = 0;
  }

  override render() {
    return html\`
      <button @click=\${() => this.count--}>-</button>
      <span>\${this.count}</span>
      <button @click=\${() => this.count++}>+</button>
    \`;
  }
}

if (!customElements.get(tagName)) {
  customElements.define(tagName, MyCounter);
}
  `,
};

async function main() {
  const name = Deno.args[0];
  if (!name) {
    console.error('Usage: deno run -A jsr:@lessjs/create <project-name>');
    Deno.exit(1);
  }

  const cwd = Deno.cwd();
  const targetDir = resolve(cwd, name);
  const relativeTarget = relative(cwd, targetDir);

  if (
    !relativeTarget || relativeTarget === '..' || relativeTarget.startsWith(`..${sep}`) ||
    isAbsolute(relativeTarget)
  ) {
    console.error(`Refusing to create project outside the current directory: ${name}`);
    Deno.exit(1);
  }

  try {
    await Deno.stat(targetDir);
    console.error(`Directory "${name}" already exists.`);
    Deno.exit(1);
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) {
      console.error(`Failed to inspect target directory "${name}": ${e}`);
      Deno.exit(1);
    }
  }

  try {
    await Deno.mkdir(targetDir, { recursive: true });
  } catch (e) {
    console.error(`Failed to create directory "${name}": ${e}`);
    Deno.exit(1);
  }

  for (const [path, content] of Object.entries(TPL)) {
    const fullPath = join(targetDir, path);
    await Deno.mkdir(dirname(fullPath), { recursive: true });
    await Deno.writeTextFile(fullPath, content);
    console.log(`  created ${path}`);
  }

  console.log(`\nLessJS project created at ./${relativeTarget}/`);
  console.log(`\n  cd ${relativeTarget}`);
  console.log('  deno task dev');
}

main();
