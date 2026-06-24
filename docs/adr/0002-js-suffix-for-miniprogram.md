# 0002: 小程序前端文件使用 .js 后缀

**Status**: Accepted

当前有效实现、workstream 修改目标和验收路径以 `.js` 文件为准；`.ts` 文件视为历史遗留或过期分叉，不作为当前执行目标。

## Context

项目早期可能同时存在 `.js` 和 `.ts` 文件。随着 workstream 推进，明确统一为 `.js`。

## Decision

全部使用 `.js`。`.ts` 文件被视为"旧违规实现"或"过期分叉"。此规则在多个 workstream 文档中反复声明为红线。

## Evidence

| 来源 | 内容 |
|------|------|
| `AGENTS.md` 工作流规则 | 多线程 workstream 模型中所有页面代码路径指向 `.js` |
| `.codex/skills/workstream-delegation/SKILL.md` | "文件后缀 .js（不是 .ts）" |
| `workstreams/06-backend-api/TASKS-mock-replacement-v1.md` 第 245 行 | "文件后缀 .js" |
| `workstreams/06-backend-api/HANDOFF.md` 第 43 行 | "文件后缀 .js（不是 .ts）" |
| `.codex/skills/evidence-driven-delivery/SKILL.md` | 代码路径均使用 `.js` 引用 |

## Consequences

- 所有子 Agent 和 Trae 必须以 `.js` 编写和修改文件
- 现有 `.ts` 文件保留但不同步（demo-cleanup-v1 仅同步了文案层面）
- `node --check` 只校验 `.js` 文件

## Alternatives considered

- **全部 .ts**：TypeScript 提供类型安全，但本项目规则明确选择 `.js`，且现有 `transport.ts` 等文件包含已被 `.js` 版本取代的旧实现
- **双后缀并存**：会造成维护混乱，mock-replacement-v1 的 B3 blocker 正是因此产生
