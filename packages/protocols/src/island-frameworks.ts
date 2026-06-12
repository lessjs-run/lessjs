export type IslandFrameworkStatus = 'priority' | 'frozen';

export interface IslandFrameworkPlan {
  framework: string;
  status: IslandFrameworkStatus;
  reason: string;
}

export const V040_ISLAND_FRAMEWORK_PLAN: readonly IslandFrameworkPlan[] = [
  {
    framework: 'preact',
    status: 'priority',
    reason: 'v0.40 heavy-framework island proof aligned with Fresh/Deno lineage.',
  },
  {
    framework: 'vue',
    status: 'frozen',
    reason: 'Superseded for the pre-1.0 path by ADR-0101.',
  },
  {
    framework: 'react',
    status: 'frozen',
    reason: 'Broad heavy-island expansion is out of v0.40 scope.',
  },
  {
    framework: 'svelte',
    status: 'frozen',
    reason: 'Broad heavy-island expansion is out of v0.40 scope.',
  },
];

export function getIslandFrameworkPlan(framework: string): IslandFrameworkPlan | undefined {
  return V040_ISLAND_FRAMEWORK_PLAN.find((entry) => entry.framework === framework);
}

export function assertIslandFrameworkAllowed(framework: string): void {
  const plan = getIslandFrameworkPlan(framework);
  if (!plan) {
    throw new Error(`No island framework plan for ${framework}. Add ADR evidence before use.`);
  }
  if (plan.status !== 'priority') {
    throw new Error(`${framework} island expansion is frozen for v0.40: ${plan.reason}`);
  }
}
