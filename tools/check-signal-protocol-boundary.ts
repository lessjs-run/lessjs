type Failure = {
  file: string;
  message: string;
};

const failures: Failure[] = [];
const sourceRoots = ['packages/core/src', 'packages/elements/src'];
const protectedPackageConfigs = [
  'packages/core/deno.json',
  'packages/elements/deno.json',
];
const forbiddenRequiredDeps = ['@preact/signals-core', '@preact/signals'];

async function walk(dir: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      files.push(...await walk(path));
    } else if (entry.isFile && path.endsWith('.ts')) {
      files.push(path);
    }
  }
  return files;
}

for (const root of sourceRoots) {
  for (const file of await walk(root)) {
    const text = await Deno.readTextFile(file);
    for (const dep of forbiddenRequiredDeps) {
      if (text.includes(dep)) {
        failures.push({
          file,
          message:
            `${dep} must not be required by core or elements; ADR-0104 only allows candidates behind SignalEngine`,
        });
      }
    }
    const imports = [...text.matchAll(/import\s+([^;]+?)\s+from\s+['"]@openelement\/signals['"]/g)];
    for (const match of imports) {
      const clause = match[1] ?? '';
      if (clause.includes('type ')) {
        failures.push({
          file,
          message:
            'core must import signal protocol types from @openelement/protocols/signals, not @openelement/signals',
        });
      }
    }
  }
}

for (const file of protectedPackageConfigs) {
  const text = await Deno.readTextFile(file);
  for (const dep of forbiddenRequiredDeps) {
    if (text.includes(dep)) {
      failures.push({
        file,
        message:
          `${dep} must not be a required dependency of @openelement/core or @openelement/elements`,
      });
    }
  }
}

if (failures.length > 0) {
  console.error('Signal protocol boundary check failed:');
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.message}`);
  }
  Deno.exit(1);
}

console.log('Signal protocol boundary check passed.');
