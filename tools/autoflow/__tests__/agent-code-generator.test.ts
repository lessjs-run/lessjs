/**
 * AgentCodeGenerator tests — v0.35.6
 *
 * Tests: safety boundaries, gate execution, file write/read-back,
 * risk-based gate selection, CodeGenerator interface compliance.
 */
import { assert, assertEquals, assertFalse } from 'jsr:@std/assert@^1.0.0';
import { AgentCodeGenerator, getGatesForRisk, isProtectedPath } from '../agent-code-generator.ts';

// ---- Helper ----

function tempProject(): string {
  const dir = Deno.makeTempDirSync({ prefix: 'autoflow-test-agent-' });
  // Create a minimal project structure
  Deno.mkdirSync(`${dir}/packages/core/src`, { recursive: true });
  Deno.writeTextFileSync(`${dir}/packages/core/src/index.ts`, 'export const x = 1;\n');
  Deno.writeTextFileSync(
    `${dir}/deno.json`,
    JSON.stringify({ tasks: { 'fmt:check': 'echo ok', lint: 'echo ok' } }),
  );
  return dir;
}

// ---- Safety Boundary Tests ----

Deno.test('isProtectedPath: rejects tools/autoflow/', () => {
  assert(isProtectedPath('tools/autoflow/executor.ts'));
  assert(isProtectedPath('tools/autoflow/__tests__/foo.test.ts'));
});

Deno.test('isProtectedPath: rejects .github/workflows/', () => {
  assert(isProtectedPath('.github/workflows/test.yml'));
  assert(isProtectedPath('.github/workflows/lint.yml'));
});

Deno.test('isProtectedPath: rejects docs/governance/', () => {
  assert(isProtectedPath('docs/governance/PROJECT_WORKFLOW.md'));
  assert(isProtectedPath('docs/governance/BRANCHING.md'));
});

Deno.test('isProtectedPath: rejects root deno.json', () => {
  assert(isProtectedPath('deno.json'));
});

Deno.test('isProtectedPath: allows package files', () => {
  assertFalse(isProtectedPath('packages/core/src/index.ts'));
  assertFalse(isProtectedPath('packages/core/deno.json'));
  assertFalse(isProtectedPath('packages/app/README.md'));
});

Deno.test('isProtectedPath: allows docs files', () => {
  assertFalse(isProtectedPath('docs/guide/security.md'));
  assertFalse(isProtectedPath('docs/adr/ADR-0089.md'));
  assertFalse(isProtectedPath('docs/sop/v0.35.6/README.md'));
});

Deno.test('isProtectedPath: allows bench and tools files', () => {
  assertFalse(isProtectedPath('bench/render.bench.ts'));
  assertFalse(isProtectedPath('tools/bump-version.ts'));
  assertFalse(isProtectedPath('tools/consumer-smoke.ts'));
});

// ---- Risk-Based Gate Selection Tests ----

Deno.test('getGatesForRisk: low risk → fmt + lint', () => {
  const gates = getGatesForRisk('low');
  assertEquals(gates.length, 2);
  assert(gates.includes('fmt:check'));
  assert(gates.includes('lint'));
});

Deno.test('getGatesForRisk: medium risk → fmt + lint + typecheck', () => {
  const gates = getGatesForRisk('medium');
  assertEquals(gates.length, 3);
  assert(gates.includes('typecheck'));
});

Deno.test('getGatesForRisk: high risk → fmt + lint + typecheck + test', () => {
  const gates = getGatesForRisk('high');
  assertEquals(gates.length, 4);
  assert(gates.includes('test'));
});

Deno.test('getGatesForRisk: critical risk → all 12 gates', () => {
  const gates = getGatesForRisk('critical');
  assertEquals(gates.length, 12);
  assert(gates.includes('build'));
  assert(gates.includes('publish:dry-run'));
});

// ---- File Write Tests ----

Deno.test('generateTests: writes test file to disk', async () => {
  const root = tempProject();
  const gen = new AgentCodeGenerator({ projectRoot: root, skipGates: true });

  const result = await gen.generateTests({
    cellId: 'cell-test-001',
    cellType: 'version-bump',
    description: 'Test cell',
    files: ['packages/core/src/index.ts'],
  });

  assert(result.success);
  assertEquals(Object.keys(result.files).length, 1);

  // Verify file was written
  const testPath = Object.keys(result.files)[0];
  const content = Deno.readTextFileSync(`${root}/${testPath}`);
  assert(content.includes('cell-test-001'));
  assert(content.includes('Deno.test'));

  Deno.removeSync(root, { recursive: true });
});

Deno.test('generateTests: rejects protected path', () => {
  // The generator generates __tests__/<cellId>.test.ts which is NOT protected,
  // so we test the safety check directly
  assert(isProtectedPath('tools/autoflow/__tests__/bad.test.ts'));
});

// ---- Implement Code Tests ----

Deno.test('implementCode: returns success with skipGates', async () => {
  const root = tempProject();
  const gen = new AgentCodeGenerator({ projectRoot: root, skipGates: true });

  const result = await gen.implementCode({
    cellId: 'cell-impl-001',
    cellType: 'version-bump',
    description: 'Implement version bump',
    files: ['packages/core/deno.json'],
  });

  assert(result.success);

  Deno.removeSync(root, { recursive: true });
});

Deno.test('implementCode: with context writes files', async () => {
  const root = tempProject();
  const gen = new AgentCodeGenerator({ projectRoot: root, skipGates: true });

  const result = await gen.implementCode({
    cellId: 'cell-impl-002',
    cellType: 'doc-align',
    description: 'Write a doc file',
    files: [],
    context: '---FILE: docs/test-output.md\n# Test\nHello world\n',
  });

  assert(result.success);

  // Verify file was written
  const content = Deno.readTextFileSync(`${root}/docs/test-output.md`);
  assert(content.includes('Hello world'));

  Deno.removeSync(root, { recursive: true });
});

// ---- Review Tests ----

Deno.test('reviewCode: always passes (advisory)', async () => {
  const root = tempProject();
  const gen = new AgentCodeGenerator({ projectRoot: root, skipGates: true });

  const result = await gen.reviewCode({
    cellId: 'cell-review-001',
    cellType: 'version-bump',
    description: 'Review',
    files: ['packages/core/src/index.ts'],
    diff: 'some diff content',
  });

  assert(result.success);
  assert(result.output.includes('Advisory pass'));

  Deno.removeSync(root, { recursive: true });
});

// ---- CodeGenerator Interface Compliance ----

Deno.test('AgentCodeGenerator implements CodeGenerator interface', () => {
  const gen = new AgentCodeGenerator({
    projectRoot: '/tmp/test',
    skipGates: true,
  });

  // Verify all three methods exist and are functions
  assertEquals(typeof gen.generateTests, 'function');
  assertEquals(typeof gen.implementCode, 'function');
  assertEquals(typeof gen.reviewCode, 'function');
});
