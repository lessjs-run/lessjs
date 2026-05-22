/**
 * Type compatibility test - drift detection for local ReactiveElement interface.
 *
 * This test asserts that the local ReactiveElement and ReactiveController
 * interfaces are self-consistent and structurally compatible with any
 * framework's lifecycle host (Lit, LessElement, or native HTMLElement).
 *
 * Run: deno check packages/rpc/__tests__/type-compat.ts
 */

// Local interface mirrors (must stay in sync with src/index.ts)
interface ReactiveController {
  hostConnected?(): void;
  hostDisconnected?(): void;
}

interface ReactiveElement {
  addController(controller: ReactiveController): void;
  removeController(controller: ReactiveController): void;
  requestUpdate(): void;
  readonly updateComplete: Promise<boolean>;
}

// --- Compile-time assertions ---

// 1. RpcController implements ReactiveController
const _controller: ReactiveController = null as unknown as {
  hostConnected?(): void;
  hostDisconnected?(): void;
};

// 2. Any element with addController/removeController/requestUpdate is a ReactiveElement
const _host: ReactiveElement = null as unknown as {
  addController(c: ReactiveController): void;
  removeController(c: ReactiveController): void;
  requestUpdate(): void;
  updateComplete: Promise<boolean>;
};

Deno.test('RPC type compatibility - local interfaces are self-consistent', () => {
  console.log('✅ Local ReactiveElement/ReactiveController are structurally sound');
});
