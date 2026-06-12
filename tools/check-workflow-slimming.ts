const failures: string[] = [];

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

for (
  const removed of [
    '.github/workflows/fast-gate.yml',
    '.github/workflows/sop-gate.yml',
    '.github/workflows/lint.yml',
  ]
) {
  if (await exists(removed)) failures.push(`${removed} should not be an active workflow.`);
}

const autoflowCi = await Deno.readTextFile('.github/workflows/autoflow-ci.yml');
if (!autoflowCi.includes('deno task autoflow:ci')) {
  failures.push('autoflow-ci.yml must call deno task autoflow:ci.');
}

const hubCi = await Deno.readTextFile('.github/workflows/hub-ci.yml');
if (!hubCi.includes('workflow_dispatch:')) {
  failures.push('hub-ci.yml must be manual-scoped while Hub is frozen.');
}
if (hubCi.includes('pull_request:')) {
  failures.push('hub-ci.yml must not accept Hub submission PRs while Hub is frozen.');
}
if (hubCi.includes('gh pr merge')) {
  failures.push('hub-ci.yml must not auto-merge archived Hub submissions.');
}

if (failures.length > 0) {
  console.error('Workflow slimming check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  Deno.exit(1);
}

console.log('Workflow slimming check passed.');
