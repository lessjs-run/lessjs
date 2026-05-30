export function toHono(pattern: string): string {
  // URLPattern regex: (\\d+) → Hono regex: {\\d+}
  return pattern.replace(/\(([^)]+)\)/g, '{$1}');
}

export function toURLPattern(pattern: string): string {
  return pattern; // Named params + optional segments are identical
}
