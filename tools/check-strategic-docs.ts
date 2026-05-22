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
  'README.en.md',
  'docs/roadmap/ROADMAP.md',
  'docs/status/STATUS.md',
  'docs/changelog/README.md',
  'docs/changelog/v0.20.0.md',
  'docs/changelog/v0.21.0.md',
  'www/app/routes/index/index.ts',
  'www/app/routes/roadmap.ts',
  'www/app/routes/guide/positioning.ts',
  'www/app/routes/engine/architecture.ts',
  'www/app/routes/engine/comparison.ts',
  'www/app/routes/engine/dsd.ts',
  'www/app/routes/engine/islands.ts',
];

const currentDocs = [
  'README.md',
  'README.en.md',
  'docs/roadmap/ROADMAP.md',
  'docs/status/STATUS.md',
  'www/app/routes/index/index.ts',
  'www/app/routes/roadmap.ts',
  'www/app/routes/guide/positioning.ts',
];

const checks: Check[] = [
  {
    name: 'ADR-0037 positioning anchors',
    files: currentDocs,
    required: ['DSD-first'],
  },
  {
    name: 'v0.21.0 is the current public line',
    files: currentDocs,
    required: ['v0.21'],
  },
  {
    name: 'v0.22 is the next framework credibility line',
    files: [
      'README.md',
      'README.en.md',
      'docs/roadmap/ROADMAP.md',
      'docs/status/STATUS.md',
      'www/app/routes/roadmap.ts',
    ],
    required: ['v0.22'],
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
