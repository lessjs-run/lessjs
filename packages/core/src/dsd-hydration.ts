/**
 * DSD Hydration contract — shared interface for all adapter packages.
 * ADR-0079: Extracted from adapter-lit/vanilla/react.
 */
export interface DsdHydration {
  _dsdHydrated: boolean;
  _hydrateEvents(): void;
}

// deno-lint-ignore no-explicit-any
export type Constructor<T = HTMLElement> = new (...args: any[]) => T;
