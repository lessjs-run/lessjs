import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import {
  assertIslandFrameworkAllowed,
  getIslandFrameworkPlan,
  V040_ISLAND_FRAMEWORK_PLAN,
} from '../island-frameworks.ts';

Deno.test('v0.40 island framework plan prioritizes only Preact', () => {
  const priority = V040_ISLAND_FRAMEWORK_PLAN.filter((entry) => entry.status === 'priority');
  assertEquals(priority.map((entry) => entry.framework), ['preact']);
  assertEquals(getIslandFrameworkPlan('preact')?.status, 'priority');
});

Deno.test('v0.40 island framework plan freezes broad heavy-island expansion', () => {
  for (const framework of ['vue', 'react', 'svelte']) {
    assertEquals(getIslandFrameworkPlan(framework)?.status, 'frozen');
    assertThrows(
      () => assertIslandFrameworkAllowed(framework),
      Error,
      `${framework} island expansion is frozen`,
    );
  }
});

Deno.test('unknown island framework requires ADR evidence', () => {
  assertThrows(
    () => assertIslandFrameworkAllowed('solid'),
    Error,
    'Add ADR evidence before use',
  );
});
