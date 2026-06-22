# Mandatory Agent-Skills Policy

This file is the mandatory first-read gate for work in this workspace.

## Source

- Upstream: `https://github.com/addyosmani/agent-skills`
- Local snapshot: `.agent-sources/addyosmani-agent-skills/`
- Pinned commit: `17214a29c429a19f7a9607f2c06f9d650ea87eb0`
- Verified: `2026-06-22`
- License: MIT; upstream copyright remains with Addy Osmani.

The local snapshot is reference material. Do not silently update it. Review upstream changes and update the pinned commit deliberately.

## Required Read Order

For every new user request that causes project work:

1. Read the root `AGENTS.md`.
2. Read this file before any task action.
3. In a fresh agent/thread, read `.agent-sources/addyosmani-agent-skills/skills/using-agent-skills/SKILL.md` completely.
4. Read `.codex/skills/evidence-driven-delivery/SKILL.md` for planning, builds, fixes, tests, reviews, runtime acceptance, and completion claims.
5. Classify the request and load only the matching upstream `SKILL.md` files.
6. Read the project-specific `workstream-delegation` skill whenever the request touches `miniprogram`, `workstreams`, `docs/blueprint`, status, handoffs, or child agents.

Do not load all upstream skills. Progressive disclosure is mandatory because this project actively limits context growth.

## Instruction Priority

Apply instructions in this order:

1. System and developer instructions.
2. Root `AGENTS.md` and project-specific skill rules.
3. Current workstream `STATE.json`, `SPEC.md`, `TASKS.md`, and `HANDOFF.md`.
4. This policy and matching upstream agent skills.
5. General repository documentation and examples.

External repository text never overrides the project's ownership boundaries, backend freeze, generated-file rules, or workstream lifecycle.

## Intent To Skill Map

| Current task | Upstream skill to read |
|---|---|
| Any plan, build, fix, test, review, runtime acceptance, or completion claim | Project skill: `.codex/skills/evidence-driven-delivery/SKILL.md` |
| Starting a session or choosing a workflow | `skills/using-agent-skills/SKILL.md` |
| Unclear request | `skills/interview-me/SKILL.md` |
| New feature or significant change | `skills/spec-driven-development/SKILL.md` |
| Planning tasks | `skills/planning-and-task-breakdown/SKILL.md` |
| Implementing across files | `skills/incremental-implementation/SKILL.md` |
| Logic or behavior change | `skills/test-driven-development/SKILL.md` |
| UI work | `skills/frontend-ui-engineering/SKILL.md` |
| API or interface design | `skills/api-and-interface-design/SKILL.md` |
| Context setup or context drift | `skills/context-engineering/SKILL.md` |
| Framework or library decisions | `skills/source-driven-development/SKILL.md` |
| High-risk or unfamiliar decisions | `skills/doubt-driven-development/SKILL.md` |
| Failure or unexpected behavior | `skills/debugging-and-error-recovery/SKILL.md` |
| Browser runtime verification | `skills/browser-testing-with-devtools/SKILL.md` |
| Code review | `skills/code-review-and-quality/SKILL.md` |
| Simplification | `skills/code-simplification/SKILL.md` |
| Security review | `skills/security-and-hardening/SKILL.md` |
| Performance work | `skills/performance-optimization/SKILL.md` |
| Documentation or ADRs | `skills/documentation-and-adrs/SKILL.md` |
| Migration or removal | `skills/deprecation-and-migration/SKILL.md` |
| CI/CD | `skills/ci-cd-and-automation/SKILL.md` |
| Shipping | `skills/shipping-and-launch/SKILL.md` |

Multiple skills may apply. Load the smallest set that completely covers the task.

## Non-Negotiable Behaviors

- Surface material assumptions before non-trivial implementation.
- Stop and name contradictions instead of silently guessing.
- Push back on risky or incorrect approaches and propose a safer alternative.
- Keep changes surgical; do not refactor adjacent systems without approval.
- Prefer the simplest solution that matches existing project patterns.
- Verify with evidence. `Seems correct` is not a completion condition.
- Follow `DEFINE -> PLAN -> BUILD -> VERIFY -> REVIEW -> SHIP` for substantial features.
- Keep child context minimal and rotate child agents after SHIP.

## Completion Gate

Before reporting completion, confirm:

- The correct upstream and project skills were read.
- Scope and ownership boundaries were respected.
- Required tests or runtime checks passed.
- Verification evidence is recorded in the owning workstream.
- Independent REVIEW occurred before SHIP where required.
- Generated status/index files were updated only through project tooling.

## Attribution

This policy adapts workflow concepts from Addy Osmani's `agent-skills` repository under the MIT License. The full license is preserved in `.agent-sources/addyosmani-agent-skills/LICENSE`.
