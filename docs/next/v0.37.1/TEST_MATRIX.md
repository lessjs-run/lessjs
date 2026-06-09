# v0.37.1 Test Matrix

| Surface            | Evidence                                                            |
| ------------------ | ------------------------------------------------------------------- |
| SSR shadow default | `packages/core/__tests__/render-dsd.test.ts`                        |
| SSR light opt-in   | `packages/core/__tests__/render-dsd.test.ts`                        |
| CSR shadow default | `packages/core/__tests__/dsd-element.test.ts`                       |
| CSR light opt-in   | `packages/core/__tests__/dsd-element.test.ts`                       |
| Type contract      | `deno task typecheck`                                               |
| Strategy docs      | `deno task docs:check-strategy`                                     |
| Workflow shape     | `deno task workflow:check`                                          |
| AutoFlow evidence  | `deno task autoflow:check-dev` and `deno task autoflow:report:json` |
