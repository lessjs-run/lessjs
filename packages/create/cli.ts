/**
 * @lessjs/create - Minimal project scaffold for LessJS framework.
 *
 * Usage: deno run -A jsr:@lessjs/create my-app
 *
 * LessJS Architecture: Keep It Simple, Stupid.
 * One template, zero prompts, instant start.
 */

import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// ??? Package versions ??????????????????????????????????????????
// ADR 0016: Handle both local (file://) and JSR remote (https://) execution.
// When running from JSR, import.meta.url is https://jsr.io/... and
// fileURLToPath() throws ERR_INVALID_URL_SCHEME.
//
// - Local:  read version from workspace deno.json (single source of truth)
// - Remote: query JSR Registry API for latest version (zero hardcoding)

const JSR_SCOPE = '@lessjs';
const PKG_DIR_MAP: Record<string, string> = {
  core: 'core',
  adapterLit: 'adapter-lit',
  adapterVite: 'adapter-vite',
  app: 'app',
  content: 'content',
  i18n: 'i18n',
  ui: 'ui',
  signals: 'signals',
};

function loadWorkspaceVersion(pkg: string): string {
  const metaUrl = import.meta.url;
  const isRemote = metaUrl.startsWith('https://') || metaUrl.startsWith('http://');

  if (isRemote) {
    // Will be resolved lazily via JSR API in resolveVersions()
    return '';
  }

  const selfPath = fileURLToPath(new URL('.', metaUrl));
  const dir = PKG_DIR_MAP[pkg] || pkg;
  const wsPath = resolve(selfPath, '..', '..', 'packages', dir, 'deno.json');
  try {
    const version = JSON.parse(Deno.readTextFileSync(wsPath)).version;
    if (!version) throw new Error(`No version found in ${wsPath}`);
    return version;
  } catch (e) {
    throw new Error(
      `Failed to read version for @lessjs/${dir} from ${wsPath}. ` +
        `Run this script from the LessJS workspace or ensure deno.json is accessible.\n` +
        `Original error: ${e}`,
    );
  }
}

/** Fetch the latest version of a JSR package from the Registry API. */
async function fetchJsrVersion(pkg: string): Promise<string> {
  const resp = await fetch(`https://jsr.io/${JSR_SCOPE}/${pkg}/meta.json`, {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) {
    throw new Error(
      `Failed to fetch version for ${JSR_SCOPE}/${pkg} from JSR Registry (HTTP ${resp.status})`,
    );
  }
  const meta = await resp.json();
  // JSR meta.json has { latest, versions: { "0.21.5": {}, ... } }
  const version = meta?.latest ?? Object.keys(meta?.versions ?? {}).pop();
  if (!version) {
    throw new Error(
      `No version found for ${JSR_SCOPE}/${pkg} in JSR Registry response`,
    );
  }
  return version;
}

/** Resolve all package versions ??local from workspace, remote from JSR API. */
async function resolveVersions(): Promise<Record<string, string>> {
  const metaUrl = import.meta.url;
  const isRemote = metaUrl.startsWith('https://') || metaUrl.startsWith('http://');

  const keys = Object.keys(PKG_DIR_MAP);
  if (!isRemote) {
    // Local: synchronous read from workspace
    const v: Record<string, string> = {};
    for (const k of keys) v[k] = loadWorkspaceVersion(k);
    return v;
  }

  // Remote: fetch all versions from JSR in parallel
  console.log('Resolving package versions from JSR...');
  const jsrNames: Record<string, string> = {
    core: 'core',
    adapterLit: 'adapter-lit',
    adapterVite: 'adapter-vite', // H-13 fix: Added missing adapterVite entry
    app: 'app',
    content: 'content',
    i18n: 'i18n',
    ui: 'ui',
    signals: 'signals',
  };
  const entries = await Promise.all(
    keys.map(async (k) => [k, await fetchJsrVersion(jsrNames[k])]),
  );
  return Object.fromEntries(entries);
}

/** Build the template map with resolved version numbers. */
function buildTemplates(v: Record<string, string>): Record<string, string> {
  return {
    '.gitignore': `dist/
node_modules/
`,
    'deno.json': `{
  "imports": {
    "vite": "npm:vite@8.0.10",
    "@deno/vite-plugin": "npm:@deno/vite-plugin@2",
    "hono": "npm:hono@^4.12.18",
    "parse5": "npm:parse5@7.0.0",
    "entities": "npm:entities@^4",
    "entities/": "npm:entities@^4/",
    "@lessjs/app": "jsr:@lessjs/app@^${v.app}",
    "@lessjs/adapter-lit": "jsr:@lessjs/adapter-lit@^${v.adapterLit}",
    "@lessjs/adapter-vite": "jsr:@lessjs/adapter-vite@^${v.adapterVite}",
    "@lessjs/content": "jsr:@lessjs/content@^${v.content}",
    "@lessjs/core": "jsr:@lessjs/core@^${v.core}",
    "@lessjs/core/navigation": "jsr:@lessjs/core@^${v.core}/navigation",
    "@lessjs/i18n": "jsr:@lessjs/i18n@^${v.i18n}",
    "@lessjs/signals": "jsr:@lessjs/signals@^${v.signals}",
    "@lessjs/signals/framework": "jsr:@lessjs/signals@^${v.signals}/framework",
    "@lessjs/ui": "jsr:@lessjs/ui@^${v.ui}",
    "@lessjs/ui/open-props-tokens": "jsr:@lessjs/ui@^${v.ui}/open-props-tokens",
    "@lessjs/ui/": "jsr:@lessjs/ui@^${v.ui}/"
  },
  "nodeModulesDir": "auto",
  "tasks": {
    "dev": "deno run --config deno.json -A npm:vite",
    "build": "deno run --config deno.json -A jsr:@lessjs/adapter-vite@^${v.adapterVite}/cli/build",
    "build:ssr": "deno run --config deno.json -A npm:vite build",
    "build:client": "deno run --config deno.json -A jsr:@lessjs/adapter-vite@^${v.adapterVite}/cli/build-client",
    "build:ssg": "deno run --config deno.json -A jsr:@lessjs/adapter-vite@^${v.adapterVite}/cli/build-ssg",
    "preview": "deno run --config deno.json -A npm:vite preview"
  },
  "compilerOptions": { "lib": ["ES2022", "DOM", "DOM.Iterable"] }
}
`,
    'vite.config.ts': `import { lessjs } from '@lessjs/app';
import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';

// Design tokens (from Open Props)
const colorTokensStyle =
  '<style>' +
  '--gray-0:#f8f9fa;--gray-1:#f1f3f5;--gray-3:#dee2e6;--gray-5:#adb5bd;--gray-7:#495057;--gray-9:#212529;' +
  '--brand:#534ab7;--size-1:4px;--size-2:8px;--size-3:12px;--size-4:16px;--border-size-1:1px;--radius-2:8px;' +
  '--font-sans:system-ui,-apple-system,sans-serif;--font-size-0:0.875rem;--font-weight-5:500;' +
  '--shadow-1:0 1px 3px 0 rgb(0 0 0 / 0.1);' +
  'body{margin:0;background:var(--gray-1);color:var(--gray-9);font-family:var(--font-sans);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>';

export default defineConfig({
  plugins: [
    // SOP-015: Virtual module passthrough — @deno/vite-plugin doesn't
    // support the "virtual:" scheme. This resolve hook intercepts virtual
    // module IDs before @deno/vite-plugin, letting the lessjs plugin handle them.
    { name: 'virtual-passthrough', resolveId(id) { if (id.startsWith('virtual:')) return '\0' + id; }, enforce: 'pre' },
    deno(),
    lessjs({
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
        // Design tokens - DRY: values from @lessjs/ui/open-props-tokens.ts
        colorTokensStyle,
      ],
    },
    // Blog + Navigation + Sitemap (from @lessjs/content)
    content: {
      blog: {
        contentDir: 'content/blog',
        basePath: '/blog',
      },
      nav: {
        headerNav: [
          { href: '/', label: 'Home' },
          { href: '/blog', label: 'Blog' },
        ],
      },
    },
  })],
});
`,
    'app/routes/index.ts': `import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/core';

export const tagName = 'home-page';

const styles = new StyleSheet();
styles.replaceSync(\`
  :host { display: block; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 2rem; margin-bottom: 0.5rem; }
  p { color: var(--text-secondary, #666); }
\`);

export default class HomePage extends DsdElement {
  static override styles = styles;

  override render() {
    return \`<h1>Hello from LessJS!</h1>
<p>Your LessJS app is running. Edit <code>app/routes/index.ts</code> to get started.</p>
<my-counter></my-counter>\`;
  }
}
`,
    'app/islands/my-counter.ts': `import { DsdElement, html, signal } from '@lessjs/core';
import { StyleSheet } from '@lessjs/core';

export const tagName = 'my-counter';

const styles = new StyleSheet();
styles.replaceSync(\`
  :host { display: inline-flex; gap: 0.5rem; align-items: center; margin-top: 1rem; }
  button { padding: 0.25rem 0.75rem; cursor: pointer; }
\`);

export default class MyCounter extends DsdElement {
  static override styles = styles;

  count = signal(0);

  override render() {
    return html\`<button @click=\${() => this.count.value--}>-</button>
<span>\${this.count}</span>
<button @click=\${() => this.count.value++}>+</button>\`;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, MyCounter);
}
  `,
  };
}

async function main() {
  const name = Deno.args[0];
  if (!name) {
    console.error('Usage: deno run -A jsr:@lessjs/create <project-name>');
    Deno.exit(1);
  }

  // H-14 fix: Validate project name format to prevent path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    console.error(
      `Invalid project name: "${name}". Project name must only contain letters, numbers, underscores, and hyphens.`,
    );
    Deno.exit(1);
  }

  const cwd = Deno.cwd();
  const targetDir = resolve(cwd, name);
  const relativeTarget = relative(cwd, targetDir);

  if (
    !relativeTarget ||
    relativeTarget === '..' ||
    relativeTarget.startsWith(`..${sep}`) ||
    isAbsolute(relativeTarget)
  ) {
    console.error(
      `Refusing to create project outside the current directory: ${name}`,
    );
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

  // Resolve package versions before generating templates
  const v = await resolveVersions();

  try {
    await Deno.mkdir(targetDir, { recursive: true });
  } catch (e) {
    console.error(`Failed to create directory "${name}": ${e}`);
    Deno.exit(1);
  }

  const TPL = buildTemplates(v);
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
