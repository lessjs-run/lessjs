# v0.36.0 Design

## Error Boundary Enhancement (Cells 004-005)

### Retry Mechanism

```typescript
class ErrorBoundary extends DsdElement {
  private _retryCount = 0;
  private _maxRetries = 3;

  retry(): void {
    if (this._retryCount < this._maxRetries) {
      this._retryCount++;
      this._error = null;
      this.update(); // trigger re-render
    }
  }

  protected onRenderError(error: Error): VNode | null {
    // Default: return static fallback HTML
    return null;
  }
}
```

### Degraded Rendering

When signal-based rendering fails, ErrorBoundary falls back to static HTML:

1. Catch error in child render()
2. Call `onRenderError()` for subclass-specific fallback
3. If no fallback, render error message with retry button

## FileIsrCache (Cell 006)

```typescript
class FileIsrCache implements IsrCache {
  constructor(private cacheDir: string) {}

  async get(key: string, now = Date.now()): Promise<IsrCacheResult> {
    // Read from file system, check TTL
  }

  async set(key: string, entry: IsrCacheEntry): Promise<void> {
    // Write to file system as JSON
  }
}
```

## Adapter-vite Decomposition (Cells 007-009)

### New Package: @openelement/ssg

Extract SSG-specific files from adapter-vite:

- `cli/build-ssg.ts` → `packages/ssg/src/build-ssg.ts`
- `cli/ssg-render.ts` → `packages/ssg/src/ssg-render.ts`
- `cli/ssg.ts` → `packages/ssg/src/ssg.ts`
- `ssg-package-resolver.ts` → `packages/ssg/src/package-resolver.ts`
- `ssg-postprocess.ts` → `packages/ssg/src/postprocess.ts`

adapter-vite retains: Vite plugin, dev server, client build, entry generation.

## SSG Parallel Rendering (Cell 010)

Use Deno Workers for parallel page rendering:

```typescript
// packages/ssg/src/parallel-render.ts
const workers = Array.from(
  { length: navigator.hardwareConcurrency ?? 4 },
  () => new Worker(new URL('./render-worker.ts', import.meta.url)),
);
// Distribute pages across workers, collect results
```

## Cross-browser E2E (Cell 011)

Extend `www/e2e/playwright.config.ts`:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
];
```
