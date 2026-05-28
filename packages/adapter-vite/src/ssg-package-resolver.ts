import type { Plugin } from 'vite';

const VIRTUAL_LESSJS_PACKAGE_PREFIX = '\0lessjs:ssg-pkg/';
// Packages resolved by this plugin for JSR consumer SSG builds.
// Optional packages (adapter-lit, adapter-vanilla, adapter-react, content, i18n)
// are handled by optionalPackageStubsPlugin in build-ssg.ts instead.
// The resolver must NOT intercept them, because it runs enforce: 'pre' and would
// prevent the stubs plugin from providing empty stubs when packages are absent.
const DEFAULT_LESSJS_PACKAGES = new Set([
  'adapter-vite',
  'app',
  'cem',
  'compat-check',
  'core',
  'hub',
  'rpc',
  'runtime',
  'signals',
  'style-sheet',
  'ui',
]);

const LESSJS_EXPORT_FILES: Record<string, Record<string, string>> = {
  core: {
    '.': 'src/index.ts',
    api: 'src/api.ts',
    'cem-parser': 'src/cem-parser.ts',
    'cli/less-add': 'src/cli/less-add.ts',
    'cli/validate-manifest': 'src/cli/validate-manifest.ts',
    compatibility: 'src/compatibility.ts',
    context: 'src/context.ts',
    'dom-simulation': 'src/dom-simulation.ts',
    errors: 'src/errors.ts',
    isr: 'src/isr.ts',
    'jsx-runtime': 'src/jsx-runtime.ts',
    'jsx-dev-runtime': 'src/jsx-runtime.ts',
    'less-add': 'src/less-add.ts',
    logger: 'src/logger.ts',
    navigation: 'src/navigation.ts',
    'render-dsd-stream': 'src/render-dsd-stream.ts',
    'render-errors': 'src/render-errors.ts',
    'render-instantiate': 'src/render-instantiate.ts',
    'render-serialize': 'src/render-serialize.ts',
    'style-sheet': 'src/style-sheet.ts',
    types: 'src/types.ts',
    'validate-manifest': 'src/validate-manifest.ts',
  },
  ui: {
    '.': 'src/index.ts',
    'less-button': 'src/less-button.tsx',
    'less-callout': 'src/less-callout.tsx',
    'less-card': 'src/less-card.tsx',
    'less-code-block': 'src/less-code-block.tsx',
    'less-dialog': 'src/less-dialog.tsx',
    'less-hero-ping': 'src/less-hero-ping.tsx',
    'less-input': 'src/less-input.tsx',
    'less-layout': 'src/less-layout.tsx',
    'less-step-card': 'src/less-step-card.tsx',
    'less-theme-toggle': 'src/less-theme-toggle.tsx',
    'open-props-tokens': 'src/open-props-tokens.ts',
    'open-props-tokens.js': 'src/open-props-tokens.ts',
  },
  runtime: { '.': 'src/index.ts' },
  signals: {
    '.': 'src/index.ts',
    framework: 'src/framework.ts',
  },
  app: { '.': 'src/index.ts' },
  'adapter-vite': {
    '.': 'src/index.ts',
    'build-context': 'src/build-context.ts',
  },
  rpc: { '.': 'src/index.ts' },
  'style-sheet': { '.': 'src/index.ts' },
  cem: { '.': 'src/index.ts' },
  'compat-check': { '.': 'src/index.ts' },
  hub: {
    '.': 'mod.ts',
    builder: 'src/builder.ts',
    'cli/check-index': 'src/cli/check-index.ts',
    'cli/hub-submit': 'src/cli/hub-submit.ts',
    'cli/less-add': 'src/cli/less-add.ts',
    'cli/validate': 'src/cli/validate.ts',
    indexer: 'src/indexer.ts',
    schema: 'src/schema.ts',
    snapshot: 'src/snapshot.ts',
    submitter: 'src/submitter.ts',
  },
};

export interface LessJsrPackageSpecifier {
  packageName: string;
  subpath: string;
  range?: string;
}

export interface LessJsrPackageResolverOptions {
  workspaceRoot: string | null;
  version: string;
  localPackageRoot?: string | null;
  fetchSource?: (url: string) => Promise<Response>;
  readLocalSource?: (path: string) => string;
}

export function parseLessPackageSpecifier(id: string): LessJsrPackageSpecifier | null {
  const bare = id.match(/^@lessjs\/([^/@]+)(?:\/(.+))?$/);
  if (bare) return { packageName: bare[1], subpath: bare[2] ?? '.' };

  const jsr = id.match(/^jsr:@lessjs\/([^/@]+)(?:@([^/]+))?(?:\/(.+))?$/);
  if (jsr) {
    return {
      packageName: jsr[1],
      range: jsr[2],
      subpath: jsr[3] ?? '.',
    };
  }

  return null;
}

export function resolveLessPackageExport(packageName: string, subpath: string): string {
  const exports = LESSJS_EXPORT_FILES[packageName];
  if (!exports) throw new Error(`[LessJS/SSG] Unknown LessJS package: @lessjs/${packageName}`);

  const normalized = normalizeSubpath(subpath);
  const file = exports[normalized] ??
    (normalized.endsWith('.js') ? exports[normalized.replace(/\.js$/, '')] : undefined);
  if (file) return file;

  throw new Error(`[LessJS/SSG] Unknown @lessjs/${packageName} export subpath: ${subpath}`);
}

export function toVirtualLessPackageId(packageName: string, sourcePath: string): string {
  return `${VIRTUAL_LESSJS_PACKAGE_PREFIX}${packageName}/${sourcePath}`;
}

export function resolveVirtualLessPackageRelative(id: string, importer: string): string | null {
  if (!importer.startsWith(VIRTUAL_LESSJS_PACKAGE_PREFIX)) return null;
  if (!id.startsWith('./') && !id.startsWith('../')) return null;

  const importerPath = importer.slice(VIRTUAL_LESSJS_PACKAGE_PREFIX.length);
  const [packageName, ...pathParts] = importerPath.split('/');
  const base = pathParts.slice(0, -1);
  const parts = [...base, ...id.split('/')];
  const resolved: string[] = [];

  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') resolved.pop();
    else resolved.push(part);
  }

  return toVirtualLessPackageId(
    packageName,
    resolveSourcePathExtension(packageName, resolved.join('/')),
  );
}

export function createLessJsrPackageResolverPlugin(
  options: LessJsrPackageResolverOptions,
): Plugin {
  const fetchSource = options.fetchSource ?? fetch;

  return {
    name: 'less:ssg-package-resolve',
    enforce: 'pre',
    resolveId(id, importer) {
      if (options.workspaceRoot) return null;

      const spec = parseLessPackageSpecifier(id);
      if (spec) {
        if (!DEFAULT_LESSJS_PACKAGES.has(spec.packageName)) return null;
        return toVirtualLessPackageId(
          spec.packageName,
          resolveLessPackageExport(spec.packageName, spec.subpath),
        );
      }

      return resolveVirtualLessPackageRelative(id, importer ?? '');
    },
    async load(id) {
      if (options.workspaceRoot) return null;
      if (!id.startsWith(VIRTUAL_LESSJS_PACKAGE_PREFIX)) return null;

      const [packageName, ...pathParts] = id.slice(VIRTUAL_LESSJS_PACKAGE_PREFIX.length).split('/');
      const filePath = pathParts.join('/');
      if (options.localPackageRoot) {
        const localPath = `${options.localPackageRoot}/packages/${packageName}/${filePath}`;
        try {
          return options.readLocalSource
            ? options.readLocalSource(localPath)
            : await Deno.readTextFile(localPath);
        } catch (error) {
          throw new Error(
            `[LessJS/SSG] Failed to read local @lessjs/${packageName}/${filePath} ` +
              `from ${localPath}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      const url = `https://jsr.io/@lessjs/${packageName}/${options.version}/${filePath}`;
      const resp = await fetchSource(url);
      if (!resp.ok) {
        throw new Error(
          `[LessJS/SSG] Failed to fetch @lessjs/${packageName}/${filePath} ` +
            `from ${url}: HTTP ${resp.status}`,
        );
      }
      const source = await resp.text();
      // JSR rewrites bare npm specifiers (e.g. 'parse5') to 'npm:parse5@x.y.z'.
      // Vite/Rolldown does not understand Deno's 'npm:' scheme, so we must
      // convert them back to bare specifiers that the bundler can resolve.
      return rewriteNpmSpecifiers(source);
    },
  };
}

function normalizeSubpath(subpath: string): string {
  if (subpath === '' || subpath === '.') return '.';
  return subpath.replace(/^\.\//, '');
}

function resolveSourcePathExtension(packageName: string, path: string): string {
  const normalized = path.replace(/\.js$/, '');
  const exports = LESSJS_EXPORT_FILES[packageName];
  if (exports) {
    const matched = Object.values(exports).find((file) =>
      file.replace(/\.(tsx|ts)$/, '') === normalized
    );
    if (matched) return matched;
  }
  return ensureTsExtension(path);
}

function ensureTsExtension(path: string): string {
  const withoutJs = path.replace(/\.js$/, '');
  if (withoutJs.endsWith('.tsx') || withoutJs.endsWith('.ts')) return withoutJs;
  return `${withoutJs}.ts`;
}

/**
 * Rewrite Deno/JSR `npm:` specifiers to bare specifiers that Vite/Rolldown
 * can resolve. JSR rewrites bare npm imports like `import from 'parse5'` to
 * `import from 'npm:parse5@7.0.0'`. Vite doesn't understand `npm:` so we
 * strip the prefix and version, leaving a bare specifier like `parse5` or
 * `@lit/reactive-element`.
 *
 * Handles:
 *   npm:package@version        → package
 *   npm:@scope/pkg@version     → @scope/pkg
 *   npm:package@version/sub    → package/sub
 *   npm:@scope/pkg@version/sub → @scope/pkg/sub
 */
const NPM_SPECIFIER_RE = /(['"])npm:(@?[a-z0-9_-]+(?:\/[a-z0-9_-]+)?)@[^'"/]+(\/[^'"]*)?\1/g;

function rewriteNpmSpecifiers(source: string): string {
  return source.replace(
    NPM_SPECIFIER_RE,
    (_match, quote: string, pkg: string, subpath?: string) => {
      return `${quote}${pkg}${subpath ?? ''}${quote}`;
    },
  );
}
