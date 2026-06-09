import { PACKAGE_VERSION_TAG } from './project-constants.ts';

type Check = {
  name: string;
  files: string[];
  required?: string[];
  forbidden?: RegExp[];
};

type Failure = {
  check: string;
  file: string;
  message: string;
};

const publicDocs = [
  'README.md',
  'README.zh.md',
  'docs/roadmap/ROADMAP.md',
  'docs/status/STATUS.md',
  'docs/changelog/README.md',
  'docs/changelog/v0.20.0.md',
  'docs/changelog/v0.21.0.md',
  'docs/changelog/v0.22.x.md',
  'docs/changelog/v0.23.0.md',
  'docs/changelog/v0.24.2.md',
  'docs/changelog/v0.24.3.md',
  'docs/changelog/v0.24.4.md',
  'docs/changelog/v0.25.0.md',
  'docs/changelog/v0.26.0.md',
  'docs/changelog/v0.26.1.md',
  'docs/changelog/v0.27.0.md',
  'docs/changelog/v0.28.0.md',
  'docs/changelog/v0.28.3.md',
  'docs/changelog/v0.28.5.md',
  'docs/changelog/v0.28.6.md',
  'docs/changelog/v0.29.0.md',
  'docs/changelog/v0.29.1.md',
  'docs/changelog/v0.29.2.md',
  'www/app/data/version.ts',
  'www/app/routes/index/index.tsx',
  'www/app/routes/roadmap.tsx',
  'www/app/routes/guide/getting-started.tsx',
  'www/app/routes/architecture/architecture.tsx',
  'www/app/routes/architecture/comparison.tsx',
  'www/app/routes/architecture/dsd.tsx',
  'www/app/routes/architecture/islands.tsx',
];

const currentDocs = [
  'README.md',
  'README.zh.md',
  'docs/roadmap/ROADMAP.md',
  'docs/status/STATUS.md',
  'www/app/routes/index/index.tsx',
  'www/app/routes/roadmap.tsx',
  'www/app/routes/guide/getting-started.tsx',
];

const checks: Check[] = [
  {
    name: 'ADR-0037 positioning anchors',
    files: currentDocs,
    required: ['DSD-first'],
  },
  {
    name: `${PACKAGE_VERSION_TAG} is the current package line`,
    files: currentDocs,
    required: [PACKAGE_VERSION_TAG],
  },
  {
    name: 'v1.0 is the stable engine target',
    files: [
      'README.md',
      'README.zh.md',
      'docs/roadmap/ROADMAP.md',
      'docs/status/STATUS.md',
      'www/app/routes/roadmap.tsx',
    ],
    required: ['v1.0'],
  },
  {
    name: 'v0.37 roadmap is split into a validation train',
    files: [
      'docs/roadmap/ROADMAP.md',
      'docs/status/STATUS.md',
      'docs/sop/README.md',
      'www/app/routes/roadmap.tsx',
    ],
    required: ['v0.37.6'],
  },
  {
    name: 'stale version and stale roadmap claims are absent',
    files: publicDocs,
    forbidden: [
      /Current version\s+<code>v0\.18\.0/i,
      /v0\.19\.0<\/strong><span>latest/i,
      /Current Version:\s*0\.19/i,
      /planned for v0\.20/i,
      /v0\.20\.0<\/strong><span>project line/i,
      /v0\.20\.0 Ocean-Island Architecture/i,
      /计划在 v0\.20/,
      /Gate currently passes at threshold Infinity/i,
      /681<\/strong><span>tests/i,
      /v0\.37\.0\s*\|\s*Server\/Data\/UI Product Closure/i,
    ],
  },
  {
    name: 'deferred framework work is not described as shipped',
    files: publicDocs,
    forbidden: [
      /request-time SSR\s+(is|are)\s+(shipped|stable|implemented)/i,
      /(Hydration strategies|Hydration strategy support)\s+(is|are)\s+(shipped|stable|implemented)/i,
      /Registry Hub\s+(is|as)\s+a mature marketplace/i,
      /Registry Hub.*成熟市场/,
    ],
  },
];

const failures: Failure[] = [];

for (const check of checks) {
  for (const file of check.files) {
    let text: string;
    try {
      text = await Deno.readTextFile(file);
    } catch (error) {
      failures.push({
        check: check.name,
        file,
        message: `cannot read file: ${error instanceof Error ? error.message : String(error)}`,
      });
      continue;
    }

    for (const required of check.required ?? []) {
      if (!text.includes(required)) {
        failures.push({
          check: check.name,
          file,
          message: `missing required anchor: ${required}`,
        });
      }
    }

    for (const pattern of check.forbidden ?? []) {
      const match = text.match(pattern);
      if (match) {
        failures.push({
          check: check.name,
          file,
          message: `forbidden claim matched: ${match[0]}`,
        });
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Strategic docs check failed:');
  for (const failure of failures) {
    console.error(`- [${failure.check}] ${failure.file}: ${failure.message}`);
  }
  Deno.exit(1);
}

console.log(`Strategic docs check passed (${checks.length} checks, ${publicDocs.length} files).`);
