# 06-backend-api SPEC

## 当前切片

- **切片**: `backend-foundation-v1`
- **阶段**: `PLAN`
- **状态**: 等待人签字 PLAN → BUILD

## 规格与方案

| 文件 | 内容 |
|------|------|
| `SPEC-backend-foundation-v1.md` | 数据库 11 表设计 + Express/TypeScript/Zod/Vitest 框架方案 |
| `PLAN-backend-foundation-v1.md` | F1→F6 BUILD 任务拆解（依赖链、文件清单、禁止项、验收命令、回滚、证据） |

## BUILD 任务（F1 → F6）

| # | 任务 | 依赖 |
|---|------|------|
| F1 | Prisma Schema — 基于 API_SPEC.md 重写 11 张表 | — |
| F2 | Express + TypeScript 脚手架 | F1 |
| F3 | 中间件链（requestId / errorHandler / validate / rateLimit） | F2 |
| F4 | Auth 中间件 + WeChat Mock 登录 | F3 |
| F5 | Health Check（/health/live + /ready） | F2 |
| F6 | Docker Compose（API + MySQL 8 + 健康检查） | F1-F5 |

> 当前 **未开始** BUILD。所有 F 级任务处于待委派状态。

## 下一步

1. 人确认 PLAN → BUILD 签字。
2. 军师更新 STATE.json（phase → BUILD），刷新 context，更新 HANDOFF。
3. 军师只委派 **F1 Prisma Schema** 给 Trae/子 Agent，F2 起等待 F1 验收通过后再委派。

## 已归档切片

- `api-contract-v1` — API_SPEC.md v1.1（已 SHIP）。见 `archive/`。

## 红线（BUILD 阶段 builder 必读）

`backend/` 目录在 BUILD 阶段可用 `.ts`，但以下红线不变：

- `miniprogram/` 禁止新建 `.ts`（ADR 0002）
- `data/*.js` 不可改
- `transport.js` 核心逻辑不可改
- `snapshot()` 保持同步（ADR 0003）
