/**
 * @kissjs/create - Minimal project scaffold for KISS framework.
 *
 * Usage: deno run -A jsr:@kissjs/create my-app
 *
 * KISS Architecture: Keep It Simple, Stupid.
 * One template, zero prompts, instant start.
 */

import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const TPL = {
  '.gitignore': `.kiss/
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
    "@lit-labs/ssr-dom-shim": "npm:@lit-labs/ssr-dom-shim@^1.5.0",
    "@kissjs/adapter-lit": "jsr:@kissjs/adapter-lit@^0.2.0",
    "@kissjs/core": "jsr:@kissjs/core@^0.5.2",
    "@kissjs/core/kiss-runtime": "jsr:@kissjs/core@^0.5.2/kiss-runtime",
    "@kissjs/ui": "jsr:@kissjs/ui@^0.5.1",
    "@kissjs/ui/tokens/colors": "jsr:@kissjs/ui@^0.5.1/tokens/colors",
    "@kissjs/ui/": "jsr:@kissjs/ui@^0.5.1/"
  },
  "nodeModulesDir": "auto",
  "tasks": {
    "dev": "deno run --config deno.json -A npm:vite",
    "build": "deno run --config deno.json -A jsr:@kissjs/core/cli/build",
    "build:ssr": "deno run --config deno.json -A npm:vite build",
    "build:client": "deno run --config deno.json -A jsr:@kissjs/core/cli/build-client",
    "build:ssg": "deno run --config deno.json -A jsr:@kissjs/core/cli/build-ssg",
    "preview": "deno run --config deno.json -A npm:vite preview"
  },
  "compilerOptions": { "lib": ["ES2022", "DOM", "DOM.Iterable"] }
}
`,
  'vite.config.ts': `import { kiss } from '@kissjs/core';
import { kissRootColorCSS } from '@kissjs/ui/tokens/colors';
import { defineConfig } from 'vite';

// DRY: All color token values come from @kissjs/ui/tokens/colors.ts
// (single source of truth). Do NOT hand-write color values here.
const colorTokensStyle = '<style>' + kissRootColorCSS + 'body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>';

const kissUiAliases = {
  '@kissjs/ui': 'https://jsr.io/@kissjs/ui/0.5.1/src/index.ts',
  '@kissjs/ui/design-tokens': 'https://jsr.io/@kissjs/ui/0.5.1/src/design-tokens.ts',
  '@kissjs/ui/kiss-button': 'https://jsr.io/@kissjs/ui/0.5.1/src/kiss-button.ts',
  '@kissjs/ui/kiss-card': 'https://jsr.io/@kissjs/ui/0.5.1/src/kiss-card.ts',
  '@kissjs/ui/kiss-code-block': 'https://jsr.io/@kissjs/ui/0.5.1/src/kiss-code-block.ts',
  '@kissjs/ui/kiss-hero-ping': 'https://jsr.io/@kissjs/ui/0.5.1/src/kiss-hero-ping.ts',
  '@kissjs/ui/kiss-input': 'https://jsr.io/@kissjs/ui/0.5.1/src/kiss-input.ts',
  '@kissjs/ui/kiss-layout': 'https://jsr.io/@kissjs/ui/0.5.1/src/kiss-layout.ts',
  '@kissjs/ui/kiss-theme-toggle': 'https://jsr.io/@kissjs/ui/0.5.1/src/kiss-theme-toggle.ts',
  '@kissjs/ui/tokens/colors': 'https://jsr.io/@kissjs/ui/0.5.1/src/tokens/colors.ts',
};

export default defineConfig({
  resolve: {
    alias: kissUiAliases,
  },
  plugins: [kiss({
    html: { title: 'My KISS App' },
    // Use pre-built UI components from @kissjs/ui
    // (JSR distributes compiled JS - no decorator errors)
    packageIslands: ['@kissjs/ui'],
    // SSR must bundle @kissjs/ui (decorators need compilation)
    ssr: {
      noExternal: ['@kissjs/ui'],
    },
    inject: {
      headFragments: [
        // Design tokens - DRY: values from @kissjs/ui/tokens/colors.ts
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
    p { color: var(--kiss-text-secondary, #666); }
    \`;

  override render() {
    return html\`
      <h1>Hello KISS!</h1>
      <p>Your KISS app is running. Edit <code>app/routes/index.ts</code> to get started.</p>
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
    console.error('Usage: deno run -A jsr:@kissjs/create <project-name>');
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

  console.log(`\nKISS project created at ./${relativeTarget}/`);
  console.log(`\n  cd ${relativeTarget}`);
  console.log('  deno task dev');
}

main();
