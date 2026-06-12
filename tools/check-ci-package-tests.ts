type Failure = {
  message: string;
};

const workflowPath = '.github/workflows/test.yml';
const failures: Failure[] = [];

async function packageNamesWithTests(): Promise<string[]> {
  const names: string[] = [];
  for await (const entry of Deno.readDir('packages')) {
    if (!entry.isDirectory) continue;
    try {
      const testInfo = await Deno.stat(`packages/${entry.name}/__tests__`);
      if (testInfo.isDirectory) names.push(entry.name);
    } catch {
      // Packages without package-scoped tests are not required to have a
      // package-specific CI job.
    }
  }
  return names.sort();
}

const workflow = await Deno.readTextFile(workflowPath);
const packages = await packageNamesWithTests();

for (const name of packages) {
  const marker = `packages/${name}/__tests__/`;
  if (!workflow.includes(marker)) {
    failures.push({
      message: `${workflowPath} does not run package tests for packages/${name}/__tests__/`,
    });
  }
}

const redundantMarkers = [...workflow.matchAll(/packages\/([^/\s]+)\/__tests__\//g)]
  .map((match) => match[1])
  .filter((name): name is string => typeof name === 'string' && !packages.includes(name));

for (const name of [...new Set(redundantMarkers)].sort()) {
  failures.push({
    message:
      `${workflowPath} references packages/${name}/__tests__/ but that test directory is missing`,
  });
}

if (failures.length > 0) {
  console.error('CI package test coverage check failed:');
  for (const failure of failures) {
    console.error(`- ${failure.message}`);
  }
  Deno.exit(1);
}

console.log(
  `CI package test coverage check passed (${packages.length} package test directories covered).`,
);
