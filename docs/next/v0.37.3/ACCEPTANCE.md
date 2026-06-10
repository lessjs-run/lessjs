# v0.37.3 Acceptance Criteria

- [ ] Data adapter contract is defined and type-safe.
- [ ] MemoryDataAdapter has unit tests proving get/keys behavior.
- [ ] FileDataAdapter has unit tests with temp directory fixtures.
- [ ] Existing ISR cache implementations remain functional (no regression).
- [ ] ADR-0095 is accepted and registered.
- [ ] All local gates pass (typecheck, test, graph:check, arch:check).
- [ ] `main` Publish to JSR passes after the hotfix, and consumer smoke is not
      skipped because of a failed publish job.
