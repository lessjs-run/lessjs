# GitHub Agent Prompts

This directory contains Copilot-style review prompts for openElement maintainers.
They are documentation assets, not CI configuration and not runtime inputs.

Every agent prompt in this directory must require reading
`docs/governance/PROJECT_WORKFLOW.md` before giving review advice.

## Files

- `adr-reviewer.agent.md` checks architecture boundaries against ADR decisions.
- `test-quality.agent.md` checks test coverage intent and regression risk.

Keep these prompts versioned because they encode project review policy that is
useful during pull request review. Update them when ADR or workflow expectations
change; do not treat them as generated artifacts.
