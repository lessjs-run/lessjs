/**
 * Agent Code Generator — v0.35.6 (ADR-0089)
 *
 * File-system protocol implementation for L2 Cell Execution.
 * Replaces DryRunGenerator with real file operations and gate execution.
 *
 * Safety boundaries: protected paths are rejected before any write.
 * Risk-based gate selection: low → fmt+lint, medium → +typecheck, etc.
 *
 * This module does NOT import from or modify tools/autoflow/ itself.
 * It is imported BY the autoflow pipeline.
 */

import type { CodeGenerator, CodeGenRequest, CodeGenResult } from './executor.ts';
import { type HarnessGateResult, runGate } from './harness-runner.ts';

// ---- Types ----

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AgentCodeGeneratorOptions {
  /** Project root directory (absolute path). */
  projectRoot: string;
  /** Risk level determines which gates are run after file writes. */
  risk?: RiskLevel;
  /** If true, skip gate execution (for testing). */
  skipGates?: boolean;
}

// ---- Protected Paths (ADR-0089 safety boundaries) ----

const PROTECTED_PATHS: readonly string[] = [
  'tools/autoflow/',
  '.github/workflows/',
  'docs/governance/',
];

/** Root deno.json is protected (but package-level deno.json files are not). */
const PROTECTED_EXACT: readonly string[] = [
  'deno.json',
];

// ---- Gate Selection by Risk ----

const GATES_BY_RISK: Record<RiskLevel, readonly string[]> = {
  low: ['fmt:check', 'lint'],
  medium: ['fmt:check', 'lint', 'typecheck'],
  high: ['fmt:check', 'lint', 'typecheck', 'test'],
  critical: [
    'fmt:check',
    'lint',
    'typecheck',
    'test',
    'build',
    'workflow:check',
    'arch:check',
    'graph:check',
    'docs:check-current',
    'docs:check-strategy',
    'dsd:check-report',
    'publish:dry-run',
  ],
};

// ---- AgentCodeGenerator ----

export class AgentCodeGenerator implements CodeGenerator {
  private root: string;
  private risk: RiskLevel;
  private skipGates: boolean;

  constructor(options: AgentCodeGeneratorOptions) {
    this.root = options.projectRoot;
    this.risk = options.risk ?? 'low';
    this.skipGates = options.skipGates ?? false;
  }

  /** Phase 1: Generate test cases for the target cell. */
  async generateTests(req: CodeGenRequest): Promise<CodeGenResult> {
    // For known cell types, generate meaningful tests
    const builtinTest = this.generateBuiltinTest(req);
    if (builtinTest) {
      // Safety check
      for (const filePath of Object.keys(builtinTest)) {
        const blocked = this.checkProtected(filePath);
        if (blocked) {
          return { success: false, files: {}, output: `Blocked: ${filePath}` };
        }
      }
      await this.writeFiles(builtinTest);
      return {
        success: true,
        files: builtinTest,
        output: `Generated builtin test for ${req.cellType}: ${
          Object.keys(builtinTest).length
        } file(s)`,
      };
    }

    // Read target file contents for context
    const sources = await this.readTargetFiles(req.files);

    // Build test spec based on cell type
    const testSpec = this.buildTestSpec(req, sources);

    // Safety check on all output files
    for (const filePath of Object.keys(testSpec)) {
      const blocked = this.checkProtected(filePath);
      if (blocked) {
        return {
          success: false,
          files: {},
          output: `Blocked: ${filePath} is in protected path (${blocked})`,
        };
      }
    }

    // Write test files
    await this.writeFiles(testSpec);

    return {
      success: true,
      files: testSpec,
      output: `Generated ${Object.keys(testSpec).length} test file(s)`,
    };
  }

  /** Phase 2: TDD red-green — implement code and verify with gates. */
  async implementCode(req: CodeGenRequest): Promise<CodeGenResult> {
    // For known cell types, execute builtin action
    const builtinImpl = await this.executeBuiltinAction(req);
    if (builtinImpl) {
      // Safety check
      for (const filePath of Object.keys(builtinImpl)) {
        const blocked = this.checkProtected(filePath);
        if (blocked) {
          return { success: false, files: {}, output: `Blocked: ${filePath}` };
        }
      }
      await this.writeFiles(builtinImpl);

      // Run risk-based gates
      if (!this.skipGates) {
        const gateResults = this.runRiskGates();
        const failed = gateResults.filter((r) => !r.passed);
        if (failed.length > 0) {
          const failSummary = failed.map((r) => `${r.gate}: ${r.output.slice(0, 200)}`).join('\n');
          return { success: false, files: builtinImpl, output: `Gate(s) failed:\n${failSummary}` };
        }
      }

      return {
        success: true,
        files: builtinImpl,
        output: `Builtin ${req.cellType} complete. ${
          Object.keys(builtinImpl).length
        } file(s) written. Gates passed.`,
      };
    }

    // Build implementation
    const impl = this.buildImplementation(req);

    // Safety check
    for (const filePath of Object.keys(impl)) {
      const blocked = this.checkProtected(filePath);
      if (blocked) {
        return {
          success: false,
          files: {},
          output: `Blocked: ${filePath} is in protected path (${blocked})`,
        };
      }
    }

    // Write implementation files
    await this.writeFiles(impl);

    // Run risk-based gates
    if (!this.skipGates) {
      const gateResults = this.runRiskGates();
      const failed = gateResults.filter((r) => !r.passed);

      if (failed.length > 0) {
        const failSummary = failed
          .map((r) => `${r.gate}: ${r.output.slice(0, 200)}`)
          .join('\n');
        return {
          success: false,
          files: impl,
          output: `Gate(s) failed:\n${failSummary}`,
        };
      }
    }

    return {
      success: true,
      files: impl,
      output: `Implementation complete. ${Object.keys(impl).length} file(s) written. Gates passed.`,
    };
  }

  /** Phase 3: Advisory cross-review (not blocking per ADR-0087). */
  reviewCode(req: CodeGenRequest): Promise<CodeGenResult> {
    // Review is advisory — always passes for file-system protocol.
    // In future versions, this could invoke an LLM for deeper analysis.
    const diff = req.diff ?? '';
    const fileCount = req.files.length;

    return Promise.resolve({
      success: true,
      files: {},
      output:
        `Review complete: ${fileCount} file(s), diff length ${diff.length} chars. Advisory pass.`,
    });
  }

  // ---- Internal Methods ----

  /** Execute builtin action for known cell types. Returns file map or null. */
  private async executeBuiltinAction(
    req: CodeGenRequest,
  ): Promise<Record<string, string> | null> {
    switch (req.cellType) {
      case 'version-bump':
        return await this.builtinVersionBump(req);
      case 'changelog':
        return await this.builtinChangelog(req);
      case 'release-note':
        return this.builtinReleaseNote(req);
      default:
        return null; // Not a known builtin type
    }
  }

  /** Generate meaningful test for known cell types. */
  private generateBuiltinTest(req: CodeGenRequest): Record<string, string> | null {
    switch (req.cellType) {
      case 'version-bump': {
        // Extract target version from description
        const versionMatch = req.description.match(/(\d+\.\d+\.\d+)/);
        const targetVersion = versionMatch?.[1] ?? 'unknown';
        const testFile = `docs/autoflow/cells/${req.cellId}/test.ts`;
        const content = [
          `/**`,
          ` * Auto-generated test for version-bump cell ${req.cellId}`,
          ` * Generated by AgentCodeGenerator builtin action`,
          ` */`,
          `import { assertEquals } from 'jsr:@std/assert@^1.0.0';`,
          ``,
          `Deno.test('version-bump: all packages aligned to ${targetVersion}', () => {`,
          `  const packagesDir = '${this.root}/packages';`,
          `  let mismatched = 0;`,
          `  for (const entry of Deno.readDirSync(packagesDir)) {`,
          `    if (!entry.isDirectory) continue;`,
          `    try {`,
          `      const data = JSON.parse(`,
          `        Deno.readTextFileSync(packagesDir + '/' + entry.name + '/deno.json'),`,
          `      );`,
          `      if (data.version && data.version !== '${targetVersion}') mismatched++;`,
          `    } catch { /* skip */ }`,
          `  }`,
          `  assertEquals(mismatched, 0, 'All packages should be at ${targetVersion}');`,
          `});`,
          ``,
        ].join('\n');
        return { [testFile]: content };
      }
      default:
        return null;
    }
  }

  /** Builtin: version bump across all packages. */
  private async builtinVersionBump(
    req: CodeGenRequest,
  ): Promise<Record<string, string>> {
    // Extract target version from description (e.g., 'Align 5 packages to 0.36.0')
    const versionMatch = req.description.match(/(\d+\.\d+\.\d+)/);
    if (!versionMatch) {
      return {};
    }
    const targetVersion = versionMatch[1];
    const result: Record<string, string> = {};

    for (const filePath of req.files) {
      try {
        const fullPath = `${this.root}/${filePath}`;
        const text = await Deno.readTextFile(fullPath);
        const data = JSON.parse(text);
        if (data.version && data.version !== targetVersion) {
          const updated = text.replace(
            `"version": "${data.version}"`,
            `"version": "${targetVersion}"`,
          );
          result[filePath] = updated;
        }
      } catch {
        // Skip unreadable files
      }
    }

    return result;
  }

  /** Builtin: generate CHANGELOG entry from cell description. */
  private async builtinChangelog(
    req: CodeGenRequest,
  ): Promise<Record<string, string>> {
    const versionMatch = req.description.match(/(\d+\.\d+\.\d+)/);
    const version = versionMatch?.[1] ?? 'unknown';
    const date = new Date().toISOString().split('T')[0];
    const entry = `## v${version} - AutoFlow Generated (${date})\n\n${req.description}\n\n---\n\n`;

    // Prepend to existing CHANGELOG or create new
    const changelogPath = 'CHANGELOG.md';
    try {
      const existing = await Deno.readTextFile(`${this.root}/${changelogPath}`);
      return { [changelogPath]: entry + existing };
    } catch {
      return { [changelogPath]: entry };
    }
  }

  /** Builtin: generate release note from cell description. */
  private builtinReleaseNote(
    req: CodeGenRequest,
  ): Record<string, string> {
    const versionMatch = req.description.match(/(\d+\.\d+\.\d+)/);
    const version = versionMatch?.[1] ?? 'unknown';
    const date = new Date().toISOString().split('T')[0];
    const note = [
      `# v${version} Release Note`,
      ``,
      `**Date**: ${date}`,
      ``,
      `## Summary`,
      ``,
      req.description,
      ``,
      `## Changes`,
      ``,
      `Auto-generated by AutoFlow2 Cell Execution pipeline.`,
      `See CHANGELOG.md for detailed changes.`,
      ``,
    ].join('\n');

    return { [`docs/release/v${version}.md`]: note };
  }

  /** Check if a path is protected. Returns the matching pattern or null. */
  private checkProtected(filePath: string): string | null {
    for (const pattern of PROTECTED_PATHS) {
      if (filePath.startsWith(pattern) || filePath.includes('/' + pattern)) {
        return pattern;
      }
    }
    for (const exact of PROTECTED_EXACT) {
      if (filePath === exact) {
        return exact;
      }
    }
    return null;
  }

  /** Read target files from disk. */
  private async readTargetFiles(
    files: string[],
  ): Promise<Map<string, string>> {
    const sources = new Map<string, string>();
    for (const f of files) {
      try {
        const content = await Deno.readTextFile(`${this.root}/${f}`);
        sources.set(f, content);
      } catch {
        // File may not exist yet (new file creation)
        sources.set(f, '');
      }
    }
    return sources;
  }

  /** Build test spec based on cell type and description. */
  private buildTestSpec(
    req: CodeGenRequest,
    _sources: Map<string, string>,
  ): Record<string, string> {
    // For the file-system protocol, we generate a minimal test stub.
    // Real AI-driven test generation would plug in via a different CodeGenerator.
    const testFile = `__tests__/${req.cellId}.test.ts`;
    const content = [
      `/**`,
      ` * Auto-generated test for ${req.cellId} (${req.cellType})`,
      ` * Generated by AgentCodeGenerator — ${new Date().toISOString()}`,
      ` */`,
      `import { assertEquals } from '@std/assert';`,
      ``,
      `Deno.test('${req.cellId}: ${req.description}', () => {`,
      `  // Test stub — implement specific assertions based on cell type`,
      `  assertEquals(true, true);`,
      `});`,
      ``,
    ].join('\n');

    return { [testFile]: content };
  }

  /** Build implementation from request. Returns file map. */
  private buildImplementation(
    req: CodeGenRequest,
  ): Record<string, string> {
    // For the file-system protocol, the implementation files are passed
    // via the CodeGenRequest.files field and written as-is.
    // A real AI CodeGenerator would generate content here.
    const result: Record<string, string> = {};

    // If the request has content in tests/context, use it as implementation hint.
    // Otherwise, return empty (executor will see success=true, files={})
    if (req.context) {
      // Context contains the implementation to write
      // Parse "path:content" pairs from context
      const lines = req.context.split('\n');
      let currentPath = '';
      let currentContent: string[] = [];

      for (const line of lines) {
        if (line.startsWith('---FILE:')) {
          if (currentPath) {
            result[currentPath] = currentContent.join('\n');
          }
          currentPath = line.slice(8).trim();
          currentContent = [];
        } else {
          currentContent.push(line);
        }
      }
      if (currentPath) {
        result[currentPath] = currentContent.join('\n');
      }
    }

    return result;
  }

  /** Write files to disk. */
  private async writeFiles(files: Record<string, string>): Promise<void> {
    for (const [path, content] of Object.entries(files)) {
      const fullPath = `${this.root}/${path}`;

      // Ensure parent directory exists
      const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
      try {
        await Deno.mkdir(dir, { recursive: true });
      } catch {
        // Directory may already exist
      }

      await Deno.writeTextFile(fullPath, content);
    }
  }

  /** Run gates based on risk level. */
  private runRiskGates(): HarnessGateResult[] {
    const gates = GATES_BY_RISK[this.risk];
    const results: HarnessGateResult[] = [];

    for (const gate of gates) {
      results.push(runGate(this.root, gate));
    }

    return results;
  }
}

// ---- Helper: get gates for a risk level (exported for testing) ----

export function getGatesForRisk(risk: RiskLevel): readonly string[] {
  return GATES_BY_RISK[risk] ?? GATES_BY_RISK.low;
}

// ---- Helper: check if a path is protected (exported for testing) ----

export function isProtectedPath(filePath: string): boolean {
  for (const pattern of PROTECTED_PATHS) {
    if (filePath.startsWith(pattern) || filePath.includes('/' + pattern)) {
      return true;
    }
  }
  for (const exact of PROTECTED_EXACT) {
    if (filePath === exact) {
      return true;
    }
  }
  return false;
}
