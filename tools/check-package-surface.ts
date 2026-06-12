import { RELEASE_PACKAGE_ORDER } from './package-release-order.ts';

type Classification = 'product-facing' | 'foundation' | 'adapter' | 'archive-candidate';

type SurfaceRecord = {
  className: Classification;
  decision: string;
};

const surface: Record<string, SurfaceRecord> = {
  '@openelement/app': {
    className: 'product-facing',
    decision: 'Framework authoring API; keep first-run.',
  },
  '@openelement/create': {
    className: 'product-facing',
    decision: 'Starter and consumer entry; keep first-run.',
  },
  '@openelement/protocols': {
    className: 'product-facing',
    decision: 'Runtime-free replacement boundary; keep first-run.',
  },
  '@openelement/ui': {
    className: 'product-facing',
    decision: 'First-party open-* component library; keep first-run.',
  },
  '@openelement/core': {
    className: 'foundation',
    decision: 'Low-level implementation kernel; demote from first-run docs.',
  },
  '@openelement/runtime': {
    className: 'foundation',
    decision: 'Runtime support; keep if Framework still requires it.',
  },
  '@openelement/router': {
    className: 'foundation',
    decision: 'Route support; keep behind Framework surface.',
  },
  '@openelement/signals': {
    className: 'foundation',
    decision: 'Signal implementation package; default change requires ADR.',
  },
  '@openelement/style-sheet': {
    className: 'foundation',
    decision: 'CSS/StyleSheet support; keep behind Elements/UI surfaces.',
  },
  '@openelement/ssg': {
    className: 'foundation',
    decision: 'SSG implementation package; keep behind Framework surface.',
  },
  '@openelement/content': {
    className: 'foundation',
    decision: 'Content support; keep behind docs/content recipes.',
  },
  '@openelement/i18n': {
    className: 'foundation',
    decision: 'I18n support; keep behind Framework recipes.',
  },
  '@openelement/adapter-vite': {
    className: 'foundation',
    decision: 'Vite/Nitro build bridge; keep as Framework implementation.',
  },
  '@openelement/adapter-lit': {
    className: 'adapter',
    decision: 'Compatibility proof; freeze expansion unless ADR reopens.',
  },
  '@openelement/adapter-vanilla': {
    className: 'adapter',
    decision: 'Compatibility proof; freeze expansion unless ADR reopens.',
  },
  '@openelement/adapter-react': {
    className: 'adapter',
    decision: 'Compatibility proof; freeze expansion unless ADR reopens.',
  },
  '@openelement/hub': {
    className: 'archive-candidate',
    decision: 'Hub remains frozen; decide retain, merge, or remove by ADR.',
  },
  '@openelement/cem': {
    className: 'archive-candidate',
    decision: 'Tooling candidate; decide retain, merge, or remove by ADR.',
  },
  '@openelement/compat-check': {
    className: 'archive-candidate',
    decision: 'Tooling candidate; decide retain, merge, or remove by ADR.',
  },
  '@openelement/rpc': {
    className: 'archive-candidate',
    decision: 'Archived feature candidate; decide retain, merge, or remove by ADR.',
  },
};

const failures: string[] = [];

const releasePackages = RELEASE_PACKAGE_ORDER.map((step) => step.pkg).sort();
const classifiedPackages = Object.keys(surface).sort();

for (const pkg of releasePackages) {
  if (!surface[pkg]) failures.push(`${pkg} is in RELEASE_PACKAGE_ORDER but missing surface class.`);
}

for (const pkg of classifiedPackages) {
  if (!releasePackages.includes(pkg)) {
    failures.push(`${pkg} has a surface class but is missing from RELEASE_PACKAGE_ORDER.`);
  }
}

const docs = await Deno.readTextFile('docs/current/PACKAGE_SURFACE.md');
for (const [pkg, record] of Object.entries(surface)) {
  if (!docs.includes(`\`${pkg}\``)) {
    failures.push(`${pkg} missing from docs/current/PACKAGE_SURFACE.md.`);
  }
  if (!docs.includes(record.className)) {
    failures.push(`${pkg} class ${record.className} missing from docs/current/PACKAGE_SURFACE.md.`);
  }
}

for (
  const required of [
    'product-facing',
    'foundation',
    'adapter',
    'archive-candidate',
    '@openelement/elements',
    'ADR-0101',
  ]
) {
  if (!docs.includes(required)) {
    failures.push(`PACKAGE_SURFACE.md missing required anchor: ${required}`);
  }
}

if (failures.length > 0) {
  console.error('Package surface check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  Deno.exit(1);
}

console.log(`Package surface check passed (${classifiedPackages.length} packages classified).`);
