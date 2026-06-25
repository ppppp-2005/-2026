# 06-backend-api TASKS

## Phase: PLAN
## Slice: backend-foundation-v1
## State: active

---

## COMPLETED

- [x] 起草 `SPEC-backend-foundation-v1.md`（数据库 11 张表 + Express/Prisma/TypeScript/Zod 框架方案 + opaque bearer token 认证）
- [x] D1-D5 关键决策由人确认（MySQL 8 / Express / TypeScript / Zod / Vitest+Supertest）
- [x] 起草 `PLAN-backend-foundation-v1.md`（6 个 F 级 BUILD 任务，F1→F6 顺序）

---

## BUILD TASKS (F1 → F6)

| # | 任务 | 依赖 | 分钟 |
|---|------|------|------|
| F1 | Prisma Schema — 基于 SPEC 重写 11 张表 | — | ~30 |
| F2 | Express + TypeScript 脚手架 | F1 | ~20 |
| F3 | 中间件链（requestId/errorHandler/validate/rateLimit） | F2 | ~20 |
| F4 | Auth 中间件 + WeChat Mock 登录 | F3 | ~30 |
| F5 | Health Check（/health/live + /ready + 根路由） | F2 | ~10 |
| F6 | Docker Compose（API + MySQL 8 + 健康检查） | F1-F5 | ~15 |

> 每个 F 的详细目标/允许文件/禁止文件/验收命令/回滚/证据见 `PLAN-backend-foundation-v1.md`。

---

## GATE

- [ ] PLAN → BUILD 闸门：人确认 PLAN-backend-foundation-v1.md 后，按 F1→F6 委派 builder

---

## BLOCKERS

none

---

## NOTES

- api-contract-v1 已 SHIP（见 SPEC.md / HANDOFF.md / archive/）
- 当前 PLAN 阶段不创建任何代码文件
- BUILD 启动后才允许在 `backend/` 创建 `.ts` 文件
- `miniprogram/` 永远禁止新建 `.ts`（ADR 0002）
- BUILD 由 Trae/子 Agent 执行，军师（Hermes）不写产品代码
