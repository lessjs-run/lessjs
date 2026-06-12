# v0.39.0 Risk Register

| Risk                                                      | Impact                                  | Mitigation                                                      |
| --------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------- |
| Generated app does not match documented first-run imports | RC docs become misleading               | Drive implementation from create-template smoke and docs checks |
| Vite + Nitro proof diverges from starter defaults         | Deploy guidance becomes brittle         | Validate runtime/deploy evidence from the generated path        |
| Archived/internal packages leak back into public guides   | Product map loses clarity before v1.0   | Re-run docs strategy checks and review package README wording   |
| Package bump happens before implementation gates          | Release truth becomes unverifiable      | Keep package version at 0.38.0 until all v0.39 gates pass       |
| JSR publish latency distracts from roadmap execution      | External registry state blocks progress | Treat JSR publish as best-effort telemetry under ADR-0097       |
