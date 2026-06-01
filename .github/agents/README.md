# GitHub Agent Prompts

This directory contains Copilot-style review prompts for LessJS maintainers.
They are documentation assets, not CI configuration and not runtime inputs.

## Files

- `adr-reviewer.agent.md` checks architecture boundaries against ADR and SOP decisions.
- `sop-gate.agent.md` checks whether a change satisfies the active release SOP.
- `test-quality.agent.md` checks test coverage intent and regression risk.

Keep these prompts versioned because they encode project review policy that is
useful during pull request review. Update them when ADR or SOP expectations
change; do not treat them as generated artifacts.
