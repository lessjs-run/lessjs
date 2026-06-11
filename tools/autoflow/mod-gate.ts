/**
 * autoflow:gate — Unified pre-commit / pre-push gate controller.
 *
 * Reads git diff to determine the impact surface, then runs all required
 * checks. Output includes a structured impact report that serves as an
 * LLM checklist — no separate auditor needed.
 *
 * Usage: deno run --allow-read --allow-run --allow-write tools/autoflow/mod-gate.ts [--staged|--push]
 */

const COMMAND = Deno.args[0] || '--staged';

// ── Impact surface mapping ────────────────────────────────────────────────

interface CheckGroup {
  name: string;
  always: boolean;
  triggers: RegExp[];
  command: string[];
}

const CHECK_GROUPS: CheckGroup[] = [
  // Always-run fast checks
  { name: 'fmt', always: true, triggers: [], command: ['deno', 'task', 'fmt:check'] },
  { name: 'lint', always: true, triggers: [], command: ['deno', 'task', 'lint'] },
  { name: 'typecheck', always: true, triggers: [], command: ['deno', 'task', 'typecheck'] },
  { name: 'graph', always: true, triggers: [], command: ['deno', 'task', 'graph:check'] },

  // Conditional checks — only run when affected paths change
  {
    name: 'test:core',
    always: false,
    triggers: [/^packages\/core\//],
    command: [
      'deno',
      'test',
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      'packages/core/',
    ],
  },
  {
    name: 'test:adapter-lit',
    always: false,
    triggers: [/^packages\/core\/src\/dsd-/, /^packages\/adapter-lit\//],
    command: [
      'deno',
      'test',
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      'packages/adapter-lit/',
    ],
  },
  {
    name: 'test:adapter-react',
    always: false,
    triggers: [/^packages\/core\/src\/dsd-/, /^packages\/adapter-react\//],
    command: [
      'deno',
      'test',
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      'packages/adapter-react/',
    ],
  },
  {
    name: 'test:adapter-vanilla',
    always: false,
    triggers: [/^packages\/core\/src\/dsd-/, /^packages\/adapter-vanilla\//],
    command: [
      'deno',
      'test',
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      'packages/adapter-vanilla/',
    ],
  },
  {
    name: 'test:adapter-vite',
    always: false,
    triggers: [/^packages\/adapter-vite\//, /^packages\/ssg\//],
    command: [
      'deno',
      'test',
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      'packages/adapter-vite/',
    ],
  },
  {
    name: 'test:ssg',
    always: false,
    triggers: [/^packages\/ssg\//],
    command: [
      'deno',
      'test',
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      'packages/ssg/',
    ],
  },
  {
    name: 'test:ui',
    always: false,
    triggers: [/^packages\/ui\//],
    command: [
      'deno',
      'test',
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      'packages/ui/',
    ],
  },
  {
    name: 'test:app',
    always: false,
    triggers: [/^packages\/app\//],
    command: [
      'deno',
      'test',
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      'packages/app/',
    ],
  },
  {
    name: 'test:all-packages',
    always: false,
    triggers: [/^packages\//],
    command: ['deno', 'task', 'test'],
  },
  {
    name: 'build',
    always: false,
    triggers: [/^www\//, /^packages\/ui\//, /^packages\/adapter-vite\//, /^packages\/ssg\//],
    command: ['deno', 'task', 'build'],
  },
  {
    name: 'docs:check',
    always: false,
    triggers: [/^docs\//, /^www\/app\/routes\//],
    command: ['deno', 'task', 'docs:check-strategy'],
  },
  {
    name: 'docs:check-current',
    always: false,
    triggers: [/^docs\//, /^README/],
    command: ['deno', 'task', 'docs:check-current'],
  },
  {
    name: 'arch:check',
    always: false,
    triggers: [/^(packages|docs|www)\//],
    command: ['deno', 'task', 'arch:check'],
  },
  {
    name: 'workflow:check',
    always: false,
    triggers: [/^(docs|deno\.json)\//, /^deno\.json$/],
    command: ['deno', 'task', 'workflow:check'],
  },
  {
    name: 'autoflow:test',
    always: false,
    triggers: [/^tools\/autoflow\//],
    command: ['deno', 'task', 'autoflow:test'],
  },
  {
    name: 'autoflow:health',
    always: true,
    triggers: [],
    command: ['deno', 'task', 'autoflow:health'],
  },
  {
    name: 'autoflow:check',
    always: true,
    triggers: [],
    command: ['deno', 'task', 'autoflow:check'],
  },
  {
    name: 'verify:configs',
    always: false,
    triggers: [/^deno\.json$/, /^packages\/\w+\/deno\.json$/],
    command: ['deno', 'task', 'verify:configs'],
  },
];

// Publish gate extras (pre-push only)
const PUBLISH_EXTRAS: CheckGroup[] = [
  {
    name: 'dsd:check-report',
    always: false,
    triggers: [/^packages\//],
    command: ['deno', 'task', 'dsd:check-report'],
  },
  {
    name: 'publish:dry-run',
    always: false,
    triggers: [/^packages\//],
    command: ['deno', 'task', 'publish:dry-run'],
  },
  {
    name: 'hub:validate',
    always: false,
    triggers: [/^packages\//, /^hub-index\//],
    command: ['deno', 'task', 'hub:validate', '--', '--strict'],
  },
];

// ── Git diff scanner ────────────────────────────────────────────────────────

async function getChangedPaths(): Promise<string[]> {
  const flag = COMMAND === '--push' ? '--cached' : '--cached'; // staged = --cached
  const cmd = new Deno.Command('git', { args: ['diff', flag, '--name-only'], stdout: 'piped' });
  const output = await cmd.output();
  return new TextDecoder().decode(output.stdout).trim().split('\n').filter(Boolean);
}

function isPathAffected(paths: string[], patterns: RegExp[]): boolean {
  return patterns.length === 0 || paths.some((p) => patterns.some((pat) => pat.test(p)));
}

// ── Core runner ──────────────────────────────────────────────────────────────

interface GateResult {
  group: string;
  passed: boolean;
  output?: string;
}

async function runCheck(group: CheckGroup): Promise<GateResult> {
  const cmd = new Deno.Command(group.command[0], {
    args: group.command.slice(1),
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await cmd.output();
  const ok = output.code === 0;
  const text = new TextDecoder().decode(output.stdout) + new TextDecoder().decode(output.stderr);
  return { group: group.name, passed: ok, output: ok ? undefined : text.trim() };
}

// ── Impact surface report (LLM-facing) ──────────────────────────────────────

function buildImpactReport(paths: string[]): string {
  const lines: string[] = ['## autoflow:gate — Impact Surface Report', ''];

  // Group changes by package
  const byPkg: Map<string, string[]> = new Map();
  for (const p of paths) {
    const m = p.match(/^(packages\/\w+|www|docs|tools|deno\.json)/);
    const key = m ? m[1] : 'other';
    if (!byPkg.has(key)) byPkg.set(key, []);
    byPkg.get(key)!.push(p);
  }

  lines.push('### Changed Paths');
  for (const [pkg, files] of byPkg) {
    if (files.length <= 3) {
      lines.push(`- ${pkg}: ${files.join(', ')}`);
    } else {
      lines.push(
        `- ${pkg}: ${files.length} files (${files.slice(0, 3).join(', ')} +${
          files.length - 3
        } more)`,
      );
    }
  }

  // List required checks based on impact
  lines.push('');
  lines.push('### Required Checks (impact-driven)');
  const groups = [...CHECK_GROUPS, ...(COMMAND === '--push' ? PUBLISH_EXTRAS : [])];
  for (const g of groups) {
    if (g.always) {
      lines.push(`- [ ] ${g.name} (always)`);
    } else if (isPathAffected(paths, g.triggers)) {
      lines.push(`- [ ] ${g.name} (triggered by changed paths)`);
    }
  }

  // LLM-specific directives
  lines.push('');
  lines.push('### LLM Directives');
  lines.push('> The following impact surface analysis must be verified by the AI assistant.');
  lines.push('');

  const hasCoreChanges = paths.some((p) => /^packages\/core\//.test(p));
  const hasSsgChanges = paths.some((p) => /^packages\/ssg\//.test(p));
  const hasUiChanges = paths.some((p) => /^packages\/ui\//.test(p));
  const hasAdapterViteChanges = paths.some((p) => /^packages\/adapter-vite\//.test(p));
  const hasDocsChanges = paths.some((p) => /^(docs|README|CHANGELOG)\//.test(p));
  const hasWwwChanges = paths.some((p) => /^www\//.test(p));
  const hasConfigChanges = paths.some((p) =>
    /^deno\.json$/.test(p) || /^packages\/\w+\/deno\.json$/.test(p)
  );

  if (hasCoreChanges) {
    lines.push(
      '- !!! CORE CHANGES DETECTED — verify adapter-lit, adapter-react, adapter-vanilla tests pass',
    );
  }
  if (hasSsgChanges) {
    lines.push(
      '- !!! SSG CHANGES DETECTED — verify adapter-vite tests, build, and graph:check pass',
    );
  }
  if (hasUiChanges) {
    lines.push(
      '- !!! UI CHANGES DETECTED — verify www build, DSD output, and CSS smoke tests pass',
    );
  }
  if (hasAdapterViteChanges) {
    lines.push(
      '- !!! ADAPTER-VITE CHANGES DETECTED — verify build, consumer-smoke, and no deleted-shell regression',
    );
  }
  if (hasConfigChanges) {
    lines.push(
      '- !!! CONFIG CHANGES DETECTED — verify graph:check version alignment, README version strings, project-constants.ts',
    );
  }
  if (hasDocsChanges) {
    lines.push(
      '- !!! DOCS CHANGES DETECTED — verify STATUS.md current version line matches PACKAGE_VERSION, no legacy API refs',
    );
  }
  if (hasWwwChanges) {
    lines.push(
      '- !!! WWW CHANGES DETECTED — verify full build succeeds, DSD report 0 errors, all pages accessible',
    );
  }

  // Always check
  lines.push('- [ ] README.md / README.zh.md version references match the released package line');
  lines.push('- [ ] CHANGELOG.md entry exists before release closure');
  lines.push('- [ ] docs/release/ release note exists before tag/release');
  lines.push('- [ ] STATUS.md active execution line matches ACTIVE_VERSION');
  lines.push('- [ ] PACKAGE_VERSION_TAG remains the released package line until release bump');
  lines.push('- [ ] No dead files or stale imports introduced');

  return lines.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 autoflow:gate — reading impact surface...');

  const paths = await getChangedPaths();
  if (paths.length === 0) {
    console.log('No staged changes detected. Gate skipped.');
    Deno.exit(0);
  }

  // Print impact report (LLM consumes this)
  const report = buildImpactReport(paths);
  console.log(report);

  // Run checks
  const groups = [...CHECK_GROUPS, ...(COMMAND === '--push' ? PUBLISH_EXTRAS : [])];
  const selected = groups.filter((g) => g.always || isPathAffected(paths, g.triggers));

  console.log(`\n🔧 autoflow:gate — running ${selected.length} check(s)...\n`);

  const results: GateResult[] = [];
  for (const g of selected) {
    const label = `[${results.length + 1}/${selected.length}] ${g.command.join(' ')}`;
    await Deno.stdout.write(new TextEncoder().encode(label + '... '));
    const r = await runCheck(g);
    results.push(r);
    console.log(r.passed ? '✅' : '❌');
    if (!r.passed && r.output) {
      console.log(r.output.split('\n').slice(0, 5).join('\n'));
    }
  }

  // Summary
  const failed = results.filter((r) => !r.passed);
  console.log(`\n=== autoflow:gate Summary ===`);
  console.log(`  Passed: ${results.length - failed.length}/${results.length}`);
  console.log(`  Failed: ${failed.length}/${results.length}`);

  if (failed.length > 0) {
    console.log(`\n  Failed checks:`);
    for (const f of failed) console.log(`    ❌ ${f.group}`);
    console.log('\n❌ autoflow:gate FAILED');
    Deno.exit(1);
  }

  console.log('\n✅ autoflow:gate PASSED');
}

main();
