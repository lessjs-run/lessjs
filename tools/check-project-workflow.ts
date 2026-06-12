import { ACTIVE_VERSION } from './project-constants.ts';

type Failure = {
  file: string;
  message: string;
};

const requiredFiles = [
  'docs/governance/PROJECT_WORKFLOW.md',
  'CONTRIBUTING.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/ISSUE_TEMPLATE/bug.yml',
  '.github/ISSUE_TEMPLATE/feature.yml',
  '.github/ISSUE_TEMPLATE/architecture.yml',
  '.github/ISSUE_TEMPLATE/release-task.yml',
  '.github/ISSUE_TEMPLATE/docs.yml',
  '.github/agents/README.md',
  '.github/agents/adr-reviewer.agent.md',
  '.github/agents/sop-gate.agent.md',
  '.github/agents/test-quality.agent.md',
  `docs/next/${ACTIVE_VERSION}/README.md`,
  `docs/next/${ACTIVE_VERSION}/DESIGN.md`,
  `docs/next/${ACTIVE_VERSION}/TASKS.md`,
  `docs/next/${ACTIVE_VERSION}/ACCEPTANCE.md`,
  `docs/next/${ACTIVE_VERSION}/TEST_MATRIX.md`,
  `docs/next/${ACTIVE_VERSION}/DOCS_PLAN.md`,
  `docs/next/${ACTIVE_VERSION}/RISK_REGISTER.md`,
  `docs/next/${ACTIVE_VERSION}/RELEASE_CHECKLIST.md`,
];

const requiredAnchors: Record<string, string[]> = {
  'README.md': ['docs/governance/PROJECT_WORKFLOW.md'],
  'CONTRIBUTING.md': ['docs/governance/PROJECT_WORKFLOW.md'],
  'docs/status/STATUS.md': ['docs/governance/PROJECT_WORKFLOW.md', `docs/next/${ACTIVE_VERSION}/`],
  'docs/roadmap/ROADMAP.md': ['docs/governance/PROJECT_WORKFLOW.md'],
  'docs/sop/README.md': ['docs/governance/PROJECT_WORKFLOW.md'],
  [`docs/sop/${ACTIVE_VERSION}/README.md`]: [
    `docs/next/${ACTIVE_VERSION}/`,
    'ADR-0093',
    'ADR-0096',
    'ADR-0097',
    'ADR-0099',
    'ADR-0100',
  ],
  'docs/next/v0.37.2/README.md': [
    'docs/sop/v0.37.2/README.md',
    'ADR-0093',
  ],
  '.github/PULL_REQUEST_TEMPLATE.md': ['docs/governance/PROJECT_WORKFLOW.md'],
  '.github/agents/README.md': ['docs/governance/PROJECT_WORKFLOW.md'],
};

const failures: Failure[] = [];

async function read(file: string): Promise<string | undefined> {
  try {
    return await Deno.readTextFile(file);
  } catch {
    failures.push({ file, message: 'missing required workflow file' });
    return undefined;
  }
}

for (const file of requiredFiles) {
  await read(file);
}

for (const [file, anchors] of Object.entries(requiredAnchors)) {
  const text = await read(file);
  if (text === undefined) continue;
  for (const anchor of anchors) {
    if (!text.includes(anchor)) {
      failures.push({ file, message: `missing workflow anchor: ${anchor}` });
    }
  }
}

if (failures.length > 0) {
  console.error('Project workflow check failed:');
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.message}`);
  }
  Deno.exit(1);
}

console.log(`Project workflow check passed for ${ACTIVE_VERSION}.`);
