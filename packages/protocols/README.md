# @lessjs/protocols

Dependency-light shared LessJS contracts.

This package owns build-time and runtime-adjacent data contracts that must be
shared across packages without making feature packages depend on adapter
implementation modules.

It intentionally does not own runtime rendering, Vite plugin implementation,
reactive engine implementation, or user-facing application configuration.
