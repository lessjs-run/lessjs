/**
 * check-dist-no-object-object.ts
 *
 * v0.24.3: Prevents runtime [object Object] pollution in www/dist.
 * Scans built HTML files for the literal string "[object Object]"
 * and reports matches that indicate renderer bugs.
 *
 * Usage: deno run --allow-read tools/check-dist-no-object-object.ts
 */

const _SCAN_GLOB = 'www/dist/**/*.html';

interface Match {
  file: string;
  line: number;
  context: string;
}

// Allowed: documentation text that legitimately contains "[object Object]"
const ALLOWED_IN_FILES = [
  'migration',
  'changelog',
  'release/',
  'guide/',
];

const matches: Match[] = [];

for await (const entry of walkFiles('www/dist')) {
  if (!entry.endsWith('.html')) continue;

  const isAllowed = ALLOWED_IN_FILES.some((p) => entry.includes(p));
  const content = await Deno.readTextFile(entry);
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('[object Object]')) {
      if (isAllowed) continue; // documentation text is ok
      matches.push({
        file: entry,
        line: i + 1,
        context: line.trim().slice(0, 100),
      });
    }
  }
}

async function* walkFiles(root: string): AsyncGenerator<string> {
  try {
    const stat = await Deno.stat(root);
    if (!stat.isDirectory) {
      yield root;
      return;
    }
    for await (const entry of Deno.readDir(root)) {
      const full = `${root}/${entry.name}`;
      if (entry.isDirectory) {
        yield* walkFiles(full);
      } else {
        yield full;
      }
    }
  } catch {
    // skip
  }
}

if (matches.length > 0) {
  console.error(`❌ Found ${matches.length} [object Object] occurrence(s) in built output:\n`);
  for (const m of matches) {
    console.error(`  ${m.file}:${m.line}`);
    console.error(`    ${m.context}\n`);
  }
  Deno.exit(1);
}

console.log('✅ No [object Object] found in built output.');
