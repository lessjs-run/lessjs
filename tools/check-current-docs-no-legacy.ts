/**
 * check-current-docs-no-legacy.ts — v0.24.3 docs staleness gate.
 */
const LEGACY: Array<{ re: RegExp; name: string }> = [
  { re: /html`/, name: 'html template' },
  { re: /@prop\(/, name: '@prop()' },
  { re: /classMap\(/, name: 'classMap()' },
  { re: /when\(/, name: 'when()' },
  { re: /choose\(/, name: 'choose()' },
  { re: /repeat\(/, name: 'repeat()' },
  { re: /unsafeHTML\(/, name: 'unsafeHTML()' },
  { re: /TemplateResult/, name: 'TemplateResult' },
  { re: /renderTemplateToString/, name: 'renderTemplateToString()' },
];
const ALLOWED = [
  'migration',
  'changelog',
  'release/',
  'legacy',
  'archive',
  'sop/',
  'adr/',
  'conversation/',
  'benchmark/',
  'status/reviews/',
  'design/',
  'reference/',
  'zh/guide/',
  'guide/migration',
  'guide/static-props',
  'jsx-component-model',
  'signal-vnode-effect',
  'guide/jsx-components', // shows old API in comparison tables
  'registry/_hub-data', // auto-generated registry data
  'docs/arch/',
  'docs/guide/',
  'docs/roadmap/',
  'docs/status/', // historical context
];
const issues: Array<{ f: string; l: number; t: string }> = [];

function css(line: string) {
  return /grid-template|repeat\(.*,\s*\d/.test(line);
}

async function* walk(dir: string): AsyncGenerator<string> {
  try {
    for await (const e of Deno.readDir(dir)) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory) yield* walk(p);
      else yield p;
    }
  } catch { /* */ }
}

async function check(f: string) {
  if (!/\.(ts|tsx|md)$/.test(f) || ALLOWED.some((a) => f.includes(a))) return;
  for (const [i, line] of (await Deno.readTextFile(f)).split('\n').entries()) {
    if (css(line)) continue;
    for (const { re, name } of LEGACY) if (re.test(line)) issues.push({ f, l: i + 1, t: name });
  }
}

for (const d of ['www/app/routes', 'docs']) for await (const f of walk(d)) await check(f);
for (const f of ['packages/core/README.md', 'packages/runtime/README.md', 'README.md']) {
  await check(f);
}

if (issues.length) {
  console.error(`❌ ${issues.length} legacy API refs:\n`);
  for (const i of issues) console.error(`  ${i.f}:${i.l} — ${i.t}`);
  Deno.exit(1);
}
console.log('✅ No legacy API references in current docs.');
