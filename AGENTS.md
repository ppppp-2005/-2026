# Project Agent Rules

## Mandatory Agent-Skills Gate

Before any project task action, including planning, tool calls, file reads beyond this gate, edits, review, verification, or delegation:

1. Read `docs/agent-rules/ADDYOSMANI-AGENT-SKILLS.md`.
2. For planning, implementation, bug fixes, tests, reviews, quality checks, runtime acceptance, or any claim that work is done, read `.codex/skills/evidence-driven-delivery/SKILL.md`.
3. At the start of every fresh agent/thread, also read `.agent-sources/addyosmani-agent-skills/skills/using-agent-skills/SKILL.md`.
4. Select and read only the upstream skill files that match the current task. Do not load all skills at once.
5. Apply the selected workflow together with the project workstream lifecycle below.

This gate applies to the main agent and every child agent. System/developer instructions and this project's rules take precedence over the vendored upstream material when they conflict.

## Multi-Thread Workflow Is Mandatory

This project uses a Codex workstream model. The current main conversation is `00-main-control`; it must coordinate, review, and record work, not directly implement feature modules.

The project follows an Agent Skills lifecycle: DEFINE -> PLAN -> BUILD -> VERIFY -> REVIEW -> SHIP. Do not skip verification or review before moving to the next feature.

For every substantial feature change:

1. Use or create the matching `workstreams/<number>-<name>` folder.
2. Use or create a dedicated Codex thread for that workstream.
3. The workstream thread implements the feature.
4. The main thread reviews, records handoff status, and decides the next workstream.

The main thread may only make tiny blocking fixes, workflow documents, thread creation, and acceptance updates.

## Context Governance Is Mandatory

- Read current status from each workstream `STATE.json`; use generated `workstreams/00-main-control/STATUS.md` for overview only.
- Query `.codex/skills/workstream-delegation/scripts/context.mjs` before loading multiple handoffs.
- Give child threads a minimal context packet, not the complete main conversation.
- Keep current `TASKS.md` and `HANDOFF.md` compact; archive completed or verbose history.
- Rotate the child thread after each SHIP.
- Never edit generated status or context index files manually.

## Current Workstreams

Do not duplicate the live list here. Read `workstreams/00-main-control/STATUS.md`; current product order is defined in `docs/blueprint/frontend-completion-roadmap.md`.

## Important Boundary

Do not implement new pages, backend, login, profile, employer, messages, or API logic directly in `00-main-control`. Delegate them to their own Codex thread first.
