# 0003: session snapshot() 保持同步函数

**Status**: Accepted

`auth-session.js` 中的 `snapshot()` 函数必须保持同步调用，不得改为 async/await。

## Context

`snapshot()` 返回当前会话的内存状态快照（用户信息、角色、登录态等），被 `employer.js` 及页面层 30+ 处调用。如果改为异步，所有调用方都需要加 await，并可能引发调用时序问题。

## Decision

`snapshot()` 保持同步。需要异步操作（如 API 登录、fetch /me）的场合，新增独立的异步函数（`wxLogin`、`fetchMe`、`apiLogout`），不修改 `snapshot()` 的签名。

## Evidence

| 来源 | 内容 |
|------|------|
| `.codex/skills/workstream-delegation/SKILL.md` | "snapshot() is synchronous, called 30+ times. NEVER make it async." |
| `workstreams/06-backend-api/TASKS-mock-replacement-v1.md` 第 244 行 | "snapshot() 保持同步" |
| `workstreams/06-backend-api/HANDOFF.md` 第 42 行 | "snapshot() 保持同步不变（30+ 处调用，改 async 会炸）" |
| `miniprogram/services/auth-session.js` | `snapshot()` 为同步函数，返回内存状态对象 |
| `miniprogram/services/employer.js` | 直接调用 `snapshot()` 获取当前角色，无 await |

## Consequences

- **红线级别**：任何子 Agent 不得将 `snapshot()` 改为 async
- 需要异步数据时，通过独立异步函数获取，结果回写到 `snapshot()` 读取的内存状态中
- mock-replacement-v1 已按此模式新增 `fetchMe(adapter)` 异步函数，登录后回写 `apiSnapshot`

## Alternatives considered

- **改为 async**：需修改 30+ 处调用方，风险极高，且可能破坏 employer.js 等依赖同步返回值的模块
- **返回 Promise 但保持同步调用**：无意义，调用方拿不到真实值
