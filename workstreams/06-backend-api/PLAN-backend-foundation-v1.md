# 06-backend-api PLAN — backend-foundation-v1

## Lifecycle: PLAN（当前阶段，只出方案，不写代码）

---

## BUILD 顺序与依赖

```
F1: Prisma Schema           ─── 所有后续任务依赖 F1
  │
F2: Express + TS 脚手架       ─── 依赖 F1（需 schema 生成 Prisma Client）
  │                              F2/F3 可部分并行
F3: 中间件链                  ─── 依赖 F2（需 Express app 实例）
  │
F4: Auth 中间件 + WeChat Mock  ─── 依赖 F3（需 requestId + errorHandler）
  │
F5: Health Check              ─── 依赖 F2（需 Express 路由）
  │
F6: Docker Compose            ─── 依赖 F1-F5（需完整可启动的 API）
```

---

## F1 — Prisma Schema 重写

**目标**：基于 SPEC 的 11 张核心表，重写 `backend/prisma/schema.prisma`。

**当前状态**：`backend/prisma/schema.prisma` 已有 MySQL datasource + 旧版 8 张表草案，字段与 API_SPEC.md v1.1 不完全对齐。

**允许修改的文件**：
- `backend/prisma/schema.prisma`

**禁止修改的文件**：
- `miniprogram/` 任何文件
- `backend/src/`（此时尚未创建）
- `data/*.js`

**改动范围**：
- 保留 MySQL datasource 声明
- 重写以下 model（对齐 SPEC §数据库设计）：User, Session, SeekerProfile, Organization, OrganizationMember, Job, Resume, Application, Notification, AuditLog, PrivacyConsent
- 字段类型：UUID 主键 @default(uuid()), DateTime @default(now()) / @updatedAt, JSON 字段用于 skills/benefits/consentItems/resumeSnapshot
- 关系：User 1:1 SeekerProfile, User 1:N Session, Organization 1:N Job, User 1:N Resume, Job 1:N Application, User 1:N Notification
- 索引：对齐 SPEC 索引策略（唯一约束、复合索引）
- 枚举：VARCHAR + @default（MySQL ENUM 不用）
- 移除旧版表中与 API_SPEC.md v1.1 不兼容的字段

**验收命令**：
```bash
npx prisma validate                          # schema 语法通过
npx prisma format                            # 格式化无变更
node -e "require('./prisma/schema.prisma')"  # (不适用) 改为检查字段清单
# 静态核对：grep 每个 SPEC 表格中的字段名是否都在 schema 中有对应列
```

**回滚方式**：`git checkout -- backend/prisma/schema.prisma`

**证据要求**：
- `prisma validate` exit code 0
- schema diff 与 SPEC 表设计一一对应

---

## F2 — Express + TypeScript 脚手架

**目标**：搭建 Express + TypeScript 最小可启动骨架。

**允许修改/新建的文件**（仅 backend/ 目录）：
- `backend/package.json`（补充 express, typescript, ts-node, @types/express, zod, prisma 等依赖）
- `backend/tsconfig.json`
- `backend/src/index.ts`（Express 入口，含 JSON parser + 基础路由）
- `backend/src/shared/types.ts`（通用类型：ApiResponse<T>, ApiError, UserContext）
- `backend/src/config.ts`（环境变量读取：DATABASE_URL, PORT, WECHAT_APPID, WECHAT_SECRET, TOKEN_EXPIRES_IN）

**禁止修改的文件**：
- `miniprogram/` 任何文件
- `backend/prisma/schema.prisma`（F1 已确定）
- `data/*.js`

**改动范围**：
- `package.json` 新增 deps：express, cors, helmet, dotenv; devDeps：typescript, @types/express, @types/node, ts-node, tsx, vitest, supertest, @types/supertest
- `tsconfig.json`：target ES2022, module commonjs, outDir dist, strict true, esModuleInterop true
- `src/index.ts`：Express app 实例，app.use(express.json({limit:'1mb'})), app.listen(PORT)
- `src/config.ts`：dotenv 加载，导出 env 配置对象（含默认值 PORT=3000）
- 启动命令：`npx tsx src/index.ts`

**验收命令**：
```bash
npx tsc --noEmit                              # TypeScript 编译检查通过
node -e "require('./src/index')"              # (不适用 TS) 改为:
npx tsx src/index.ts & sleep 2 && curl http://localhost:3000/ && kill %1
# 期望：HTTP 200（Express 基础响应，含 X-Request-Id 头）
```

**回滚方式**：
```bash
git checkout -- backend/package.json backend/tsconfig.json
rm -f backend/src/index.ts backend/src/config.ts backend/src/shared/types.ts
```

**证据要求**：
- `tsc --noEmit` exit 0
- 服务可启动（curl 200）
- 响应含 `X-Request-Id` 头

---

## F3 — 中间件链实现

**目标**：实现 SPEC 定义的中间件链：requestId → errorHandler → validate。

**允许新建的文件**：
- `backend/src/middleware/requestId.ts`
- `backend/src/middleware/errorHandler.ts`
- `backend/src/middleware/validate.ts`
- `backend/src/middleware/__tests__/requestId.test.ts`
- `backend/src/middleware/__tests__/errorHandler.test.ts`

**禁止修改的文件**：
- `miniprogram/` 任何文件
- `data/*.js`

**改动范围**：
- `requestId.ts`：注入 `X-Request-Id`（优先使用请求头传入的，否则生成 UUID）；同时在响应头中返回
- `errorHandler.ts`：Express error middleware，映射为 `{ error: { code, message, details, requestId } }` 格式；包含已知错误类型（ValidationError, AuthError, NotFoundError）和兜底 INTERNAL_ERROR
- `validate.ts`：Zod schema 校验中间件工厂 `validate(schema)`，校验 path/query/body，失败时抛 ValidationError
- `src/index.ts`：注册所有中间件（app.use(requestId); app.use(errorHandler)）

**验收命令**：
```bash
npx vitest run src/middleware/__tests__/    # 中间件单测全绿
```

**回滚方式**：
```bash
rm -rf backend/src/middleware/
git checkout -- backend/src/index.ts
```

**证据要求**：
- Vitest 测试通过（至少覆盖：requestId 透传/生成、errorHandler 已知错误映射、validate 校验失败返回 INVALID_PARAMS）

---

## F4 — Auth 中间件 + WeChat Mock 登录

**目标**：实现 Bearer token 鉴权中间件 + `POST /api/v1/auth/wechat` mock 登录。

**允许新建的文件**：
- `backend/src/middleware/auth.ts`
- `backend/src/middleware/authorize.ts`
- `backend/src/modules/identity-access/auth.controller.ts`
- `backend/src/modules/identity-access/auth.service.ts`
- `backend/src/middleware/__tests__/auth.test.ts`

**禁止修改的文件**：
- `miniprogram/` 任何文件
- `data/*.js`

**改动范围**：
- `auth.ts`：从 Authorization header 提取 Bearer token → SHA-256 hash → 查 Session 表 → 检查未过期且 active → `req.user = { id, role, openId }`
- `authorize.ts`：`authorize(roles: string[])` 中间件工厂，检查 req.user.role
- `auth.service.ts`：login(code) → **mock 模式下不调微信**，使用固定测试 openId（`MOCK_OPENID_001`）→ 创建/查找 User → 生成 256bit random token → 存储 hash → 返回 `{ token, expiresIn, user }`
- `auth.controller.ts`：`POST /api/v1/auth/wechat` 路由 handler，调用 authService.login()
- Mock 实现：仅用于本地开发，`NODE_ENV=development` 且未配置 `WECHAT_APPID` 时启用
- 安全：mock 模式下 session_key 不生成/不返回；token 只存 hash

**验收命令**：
```bash
npx vitest run src/middleware/__tests__/auth.test.ts
# 期望：auth 中间件测试全绿（有效 token → 200, 过期 → 401, 无 token → 401）
npx tsx src/index.ts &
sleep 2
curl -X POST http://localhost:3000/api/v1/auth/wechat -H 'Content-Type: application/json' -d '{"code":"mock_code"}'
# 期望：201, 返回 { data: { token, expiresIn, user: { id, nickName, role } } }
curl http://localhost:3000/api/v1/me -H "Authorization: Bearer $(TOKEN)"
# 期望：200, 返回当前用户信息
kill %1
```

**回滚方式**：
```bash
rm -rf backend/src/modules/identity-access/
rm -f backend/src/middleware/auth.ts backend/src/middleware/authorize.ts
rm -f backend/src/middleware/__tests__/auth.test.ts
git checkout -- backend/src/index.ts
```

**证据要求**：
- Vitest auth 中间件测试全绿
- curl 测试：mock 登录返回 token + user
- curl 测试：Bearer token 鉴权通过返回 200，无效 token 返回 401
- 确认响应体中不含 session_key

---

## F5 — Health Check 端点

**目标**：实现 `/health/live` 和 `/health/ready` 端点。

**允许新建的文件**：
- `backend/src/modules/health/health.controller.ts`

**禁止修改的文件**：
- `miniprogram/` 任何文件
- `data/*.js`

**改动范围**：
- `health.controller.ts`：
  - `GET /health/live`：返回 200 `{ status: "ok" }`（进程存活检查）
  - `GET /health/ready`：检查 MySQL 连接（`prisma.$queryRaw` SELECT 1），成功返回 200 `{ status: "ok", database: "connected" }`，失败返回 503
- `src/index.ts`：注册 health 路由（不在 /api/v1 前缀下，无需认证）

**验收命令**：
```bash
curl http://localhost:3000/health/live     # 期望 200 { status: "ok" }
curl http://localhost:3000/health/ready    # 期望 200 或 503
```

**回滚方式**：
```bash
rm -rf backend/src/modules/health/
git checkout -- backend/src/index.ts
```

**证据要求**：
- `/health/live` 返回 200
- `/health/ready` 在有 MySQL 时返回 200，无 MySQL 时返回 503

---

## F6 — Docker Compose

**目标**：编写 `docker-compose.yml` 使 API + MySQL 8 可一键启动。

**允许新建/修改的文件**：
- `backend/docker/docker-compose.yml`
- `backend/Dockerfile`

**禁止修改的文件**：
- `miniprogram/` 任何文件
- `data/*.js`

**改动范围**：
- `Dockerfile`：FROM node:20-alpine, COPY package.json + tsconfig.json + src/ + prisma/, RUN npm ci, CMD npx tsx src/index.ts
- `docker-compose.yml`：
  - `mysql` service：image mysql:8.0, port 3306, volume persist, env MYSQL_ROOT_PASSWORD/MYSQL_DATABASE
  - `api` service：build ., port 3000, depends_on mysql, env DATABASE_URL=mysql://root:password@mysql:3306/sandu_job
  - healthcheck for both services
- `.env.example`：本地开发环境变量模板（WECHAT_APPID=, WECHAT_SECRET=, DATABASE_URL=, TOKEN_EXPIRES_IN=7200）

**验收命令**：
```bash
cd backend/docker && docker compose up -d
sleep 10
curl http://localhost:3000/health/live     # 期望 200
curl http://localhost:3000/health/ready    # 期望 200 { database: "connected" }
docker compose down -v
```

**回滚方式**：
```bash
rm -f backend/docker/docker-compose.yml backend/Dockerfile backend/.env.example
```

**证据要求**：
- `docker compose up` 后两个服务均 healthy
- `/health/live` 返回 200
- `/health/ready` 返回 200 + database connected
- `docker compose down` 清理干净

---

## 红线清单（BUILD 阶段 builder 必读）

| # | 红线 | 来源 |
|---|------|------|
| 1 | `miniprogram/` 禁止新建 `.ts` 文件 | ADR 0002 |
| 2 | `backend/` 在 BUILD 阶段可以用 `.ts` | D3 决策 |
| 3 | `data/*.js` 不可改 | AGENT-RUNBOOK.md |
| 4 | `snapshot()` 保持同步 | ADR 0003 |
| 5 | `transport.js` 核心逻辑不可改 | HANDOFF.md |
| 6 | session_key 不返前端/不入日志/不入库 | SPEC |
| 7 | token 只存 SHA-256 hash | SPEC |
| 8 | 生产环境错误不暴露堆栈/密钥 | SPEC |

---

## 验收总览

```
F1 → prisma validate 通过 + schema 与 SPEC 一一对应
F2 → tsc --noEmit 通过 + curl 200 + X-Request-Id 头
F3 → vitest 中间件测试全绿
F4 → vitest auth 测试全绿 + curl mock 登录成功 + 鉴权通过
F5 → /health/live 200 + /health/ready 200/503
F6 → docker compose up 两个服务 healthy
```

所有 F1-F6 完成后，整体验收：
```bash
docker compose up -d
npx prisma migrate dev          # 建表
npx vitest run                  # 全量测试
curl /health/live               # 200
curl /health/ready              # 200
curl POST /api/v1/auth/wechat   # 201 + token
curl /api/v1/me -H "Authorization: Bearer $TOKEN"  # 200
docker compose down -v
```
