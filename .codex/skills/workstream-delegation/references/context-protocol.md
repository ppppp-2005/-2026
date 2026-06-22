# Context Protocol

## Source Of Truth

- Treat each workstream `STATE.json` as its current machine-readable status.
- Treat `SPEC.md` as stable scope, `TASKS.md` as the active slice, and `HANDOFF.md` as the latest human summary.
- Treat `docs/blueprint/decisions.md` as the global decision log.
- Treat `workstreams/00-main-control/STATUS.md` and `context/*` as generated views. Never edit them manually.
- Read `archive/` only when a current summary conflicts, validation fails, or historical evidence is explicitly needed.

## Child Context Packet

Start a child agent with no inherited conversation when possible. Pass only:

```text
WORKSTREAM: <id>
SLICE: <short id>
GOAL: <one outcome>
PHASE: <DEFINE|PLAN|BUILD|VERIFY|REVIEW>
READ: <exact files and retrieved snippets>
ALLOWED: <owned paths>
FORBIDDEN: <shared and foreign paths>
ACCEPTANCE: <observable checks>
DEPENDENCIES: <only relevant current facts>
```

Use a new child thread after every shipped slice. Reuse a thread only inside its current slice.

## Child Result Packet

Require the final message and `HANDOFF.md` to contain:

```text
RESULT: 1-3 outcome bullets
CHANGED: owned paths or path groups
VERIFY: commands/checks and pass/fail results
RISKS: unresolved risks, or "none"
BLOCKERS: required external action, or "none"
NEXT: one concrete action
```

Keep the packet short by default. Allow extra evidence for failures, migrations, security issues, or cross-module contracts, but archive verbose logs instead of pasting them into the main thread.

## Main Acceptance Sequence

1. Validate the child packet and owned paths.
2. Run `context.mjs validate`.
3. Run `context.mjs refresh` after accepted state changes.
4. Query only relevant dependencies with `context.mjs query`.
5. Read full source or archives only for conflicts, failed checks, or low-confidence retrieval.
6. Arrange VERIFY and REVIEW before SHIP.
7. Run `context.mjs archive` at SHIP and start the next slice in a fresh thread.

## CLI

```powershell
node .codex/skills/workstream-delegation/scripts/context.mjs migrate
node .codex/skills/workstream-delegation/scripts/context.mjs validate
node .codex/skills/workstream-delegation/scripts/context.mjs refresh
node .codex/skills/workstream-delegation/scripts/context.mjs query --workstream 03-jobs --query "职位 验收"
node .codex/skills/workstream-delegation/scripts/context.mjs accept --workstreams 01-project-shell,02-home-ui --summary "人工验收通过" --ref workstreams/07-quality-review/HANDOFF.md
node .codex/skills/workstream-delegation/scripts/context.mjs archive --workstream 03-jobs --slice jobs-static-ui-v1
```

Retrieval defaults to five results. Increase `--limit` when the task genuinely spans more sources.
