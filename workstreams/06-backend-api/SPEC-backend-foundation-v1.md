# 06-backend-api SPEC — backend-foundation-v1

## Current Slice

- Slice: `backend-foundation-v1`
- Lifecycle: `SPECIFY`（当前阶段，仅出 SPEC，不写代码）
- Parent: `api-contract-v1`（已 SHIP）
- Goal: 基于 API_SPEC.md v1.1 的实体关系，产出数据库 DDL 设计 + 服务端框架搭建方案 + JWT 认证设计

## Prerequisites

| 工件 | 状态 |
|------|------|
| `API_SPEC.md` v1.1 | SHIP — 24 章接口规范，§19 核心实体关系，§2 通用规范 |
| `docs/adr/0001-mysql-for-backend.md` | Accepted — MySQL 8 |
| `docs/blueprint/backend-design-placeholder.md` | Accepted (backend-architecture-v1) — 模块划分、认证流、安全框架 |
| `backend/prisma/schema.prisma` | 存量 — MySQL datasource + 8 张表草案 |

> **冲突说明**：蓝图写 PostgreSQL，ADR 0001 + 存量 schema 是 MySQL。以 ADR 为准（MySQL 8）。

## Locked Decisions（已由人确认）

| # | 决策 | 选择 | 理由 |
|---|------|------|------|
| D1 | 数据库 | MySQL 8 | ADR 0001 Accepted + 存量 schema 已用 MySQL |
| D2 | Web 框架 | Express | MVP 稳定、资料多、AI/builder 实现风险低 |
| D3 | 后端语言 | TypeScript（仅 backend/） | 蓝图 Locked Decision；miniprogram/ 前端仍然是 .js（ADR 0002） |
| D4 | 验证库 | Zod | TypeScript-first，适合请求/响应 DTO 校验 |
| D5 | 测试框架 | Vitest（单测）+ Supertest（HTTP 集成测试） | Vitest 快、TypeScript 原生支持；Supertest 是 Express 测试标准 |

## SCOPE — 数据库设计

### 设计原则

- 主键：UUID（由 Prisma `@id @default(uuid())` 生成），API 对外暴露为 opaque string
- 时间戳：全部 UTC，`created_at` + `updated_at`，Prisma `@updatedAt`
- 乐观并发：关键写操作表含 `version INT NOT NULL DEFAULT 1`，更新时 `WHERE version = current`
- 软删除：User → `status = 'deleted'`（不物理删除）；Resume → `status = 'archived'`
- 简历快照：Application 的 `resume_snapshot` 为 JSON 列，存储投递时刻的不可变副本
- 枚举：VARCHAR + 应用层校验（Prisma 推荐模式，避免 MySQL ENUM 的 ALTER TABLE 痛点）

### 核心表（对齐 API_SPEC.md §19）

```
User
  id: UUID PK
  open_id: VARCHAR UNIQUE NOT NULL       — W（微信 openId）
  union_id: VARCHAR UNIQUE               — W（微信 unionId，可选）
  nick_name: VARCHAR                     — W（微信昵称）
  avatar_url: VARCHAR                    — W（微信头像）
  role: VARCHAR NOT NULL DEFAULT 'seeker'— B（seeker | employer | admin）
  status: VARCHAR NOT NULL DEFAULT 'active' — B（active | suspended | deleted）
  version: INT NOT NULL DEFAULT 1
  created_at: DATETIME @default(now())
  updated_at: DATETIME @updatedAt

Session
  id: UUID PK
  user_id: UUID FK → User
  token_hash: VARCHAR UNIQUE NOT NULL    — B（SHA-256 of opaque bearer token）
  expires_at: DATETIME NOT NULL          — B
  status: VARCHAR NOT NULL DEFAULT 'active' — B（active | revoked | expired）
  created_at: DATETIME @default(now())

SeekerProfile
  id: UUID PK
  user_id: UUID UNIQUE FK → User        — 1:1
  real_name: VARCHAR                     — B（手动填写）
  phone: VARCHAR                         — B（手动填写，v1 不接 wx.getPhoneNumber）
  id_card: VARCHAR                       — B
  location: VARCHAR                      — B
  skills: JSON                           — B（标签数组）
  experience: VARCHAR                    — B
  version: INT NOT NULL DEFAULT 1
  created_at: DATETIME @default(now())
  updated_at: DATETIME @updatedAt

Organization
  id: UUID PK
  name: VARCHAR NOT NULL                 — B
  location: VARCHAR                      — B
  industry: VARCHAR                      — B
  size: VARCHAR                          — B
  contact_name: VARCHAR                  — B
  contact_phone: VARCHAR                 — B
  license_number: VARCHAR                — B（认证后填写）
  is_verified: BOOLEAN NOT NULL DEFAULT false — B
  status: VARCHAR NOT NULL DEFAULT 'pending_review' — B（pending_review | verified | rejected | suspended）
  version: INT NOT NULL DEFAULT 1
  created_at: DATETIME @default(now())
  updated_at: DATETIME @updatedAt

OrganizationMember
  id: UUID PK
  user_id: UUID FK → User
  organization_id: UUID FK → Organization
  role: VARCHAR NOT NULL DEFAULT 'recruiter' — B（owner | recruiter）
  status: VARCHAR NOT NULL DEFAULT 'active'  — B（invited | active | removed）
  created_at: DATETIME @default(now())

Job
  id: UUID PK
  organization_id: UUID FK → Organization
  creator_id: UUID FK → User
  title: VARCHAR NOT NULL               — B
  salary_min: INT                       — B（数字，用于排序筛选）
  salary_max: INT                       — B
  location: VARCHAR                     — B
  district: VARCHAR                     — B
  work_time: VARCHAR                    — B
  requirements: VARCHAR                 — B
  benefits: JSON                        — B（标签数组）
  headcount: INT                        — B
  employment_type: VARCHAR              — B（全职 | 兼职 | 实习）
  description: TEXT                     — B（详情页扩展字段）
  contact_name: VARCHAR                 — B
  contact_phone: VARCHAR                — B
  status: VARCHAR NOT NULL DEFAULT 'draft' — B（draft | pending_review | published | paused | closed | rejected）
  version: INT NOT NULL DEFAULT 1
  created_at: DATETIME @default(now())
  updated_at: DATETIME @updatedAt

  @@index([status, created_at DESC, id DESC])  — 公开列表游标分页

Resume
  id: UUID PK
  user_id: UUID FK → User
  real_name: VARCHAR                    — B
  phone: VARCHAR                        — B
  age: INT                              — B
  location: VARCHAR                     — B
  skills: JSON                          — B（标签数组）
  experience: VARCHAR                   — B
  education: VARCHAR                    — B
  job_intention: VARCHAR                — B
  status: VARCHAR NOT NULL DEFAULT 'draft' — B（draft | active | archived）
  version: INT NOT NULL DEFAULT 1
  created_at: DATETIME @default(now())
  updated_at: DATETIME @updatedAt

Application
  id: UUID PK
  job_id: UUID FK → Job
  seeker_user_id: UUID FK → User
  resume_snapshot: JSON NOT NULL        — B（投递时刻简历不可变副本）
  status: VARCHAR NOT NULL DEFAULT 'submitted' — B（submitted | viewed | shortlisted | rejected | withdrawn | hired）
  version: INT NOT NULL DEFAULT 1
  applied_at: DATETIME @default(now())
  updated_at: DATETIME @updatedAt

  @@unique([job_id, seeker_user_id])    — 同一求职者对同一岗位仅可投递一次

Notification
  id: UUID PK
  user_id: UUID FK → User
  type: VARCHAR NOT NULL                — B（interview | notice | system）
  title: VARCHAR NOT NULL               — B
  content: TEXT                         — B
  sender: VARCHAR                       — B
  action_url: VARCHAR                   — B（可操作跳转 URL）
  is_read: BOOLEAN NOT NULL DEFAULT false — B
  status: VARCHAR NOT NULL DEFAULT 'unread' — B（unread | read | archived）
  sent_at: DATETIME @default(now())
  created_at: DATETIME @default(now())

  @@index([user_id, status, sent_at DESC, id DESC])

AuditLog
  id: UUID PK
  actor: VARCHAR                        — B（用户 ID 或 system）
  action: VARCHAR NOT NULL              — B（login | logout | role_grant | job_publish | application_status_change 等）
  target: VARCHAR                       — B（操作对象 ID）
  request_id: VARCHAR                   — B
  metadata: JSON                        — B（脱敏前后对比，不含敏感字段）
  created_at: DATETIME @default(now())

  @@index([actor, created_at DESC])

PrivacyConsent
  id: UUID PK
  user_id: UUID FK → User
  policy_version: VARCHAR NOT NULL      — B
  consent_items: JSON NOT NULL          — B（同意项数组）
  consented_at: DATETIME NOT NULL       — B
  updated_at: DATETIME @updatedAt
```

### 表数统计

| 表 | 说明 |
|---|------|
| User | 用户根 |
| Session | 认证会话 |
| SeekerProfile | 求职者资料（1:1 User） |
| Organization | 企业 |
| OrganizationMember | 企业成员关联 |
| Job | 岗位 |
| Resume | 简历 |
| Application | 投递记录 |
| Notification | 站内消息 |
| AuditLog | 审计日志 |
| PrivacyConsent | 隐私同意记录 |

> v1 暂不建的文件/活动/培训/政策/用工/校园/返乡表：这些模块在 v1 以 mock 数据驱动，不在此切片范围内。

## SCOPE — 服务端框架方案

### 技术栈

| 层 | 选择 | 状态 |
|---|------|------|
| 运行时 | Node.js 20+ LTS | 确定 |
| 语言 | TypeScript（仅 backend/） | 确定（D3） |
| Web 框架 | Express | 确定（D2） |
| ORM | Prisma | 确定（已有依赖） |
| 数据库 | MySQL 8 | 确定（D1） |
| 验证 | Zod | 确定（D4） |
| 测试 | Vitest + Supertest | 确定（D5） |
| 容器 | Docker Compose（API + MySQL 8） | 确定 |

### 目录结构

```
backend/
├── src/
│   ├── modules/            # 按蓝图模块划分
│   │   ├── identity-access/  # 微信登录、session、JWT 中间件
│   │   ├── users/            # 用户资料、角色切换
│   │   ├── organizations/    # 企业 CRUD、认证状态
│   │   ├── jobs/             # 岗位 CRUD、搜索筛选
│   │   ├── resumes/          # 简历 CRUD
│   │   ├── applications/     # 投递、状态流转
│   │   ├── notifications/    # 消息、已读/归档
│   │   └── audit/            # 审计日志
│   ├── middleware/          # auth, requestId, errorHandler, rateLimit, validate
│   ├── shared/              # 通用类型、工具函数、cursor 编解码
│   └── index.ts             # Express 入口 + 路由注册
├── prisma/
│   ├── schema.prisma        # 数据模型（基于上面 11 张表）
│   └── migrations/          # 版本化迁移
├── docker/
│   └── docker-compose.yml   # API + MySQL 8
├── package.json
└── tsconfig.json
```

### 中间件链（请求 → 响应）

```
1. requestId         — 注入/透传 X-Request-Id；响应头返回
2. rateLimit         — 登录/搜索/写操作按 IP/User 限流
3. express.json()    — JSON body 解析（大小限制 1MB）
4. auth              — Bearer token hash → 查 Session → req.user
5. authorize(role)   — 角色/权限检查（按路由声明）
6. validate(schema)  — Zod schema 校验 path/query/body
7. handler           — 业务逻辑
8. errorHandler      — 统一映射为 API_SPEC.md §2.2 错误格式
```

### 统一错误响应

所有错误 → `{ "error": { "code": "...", "message": "...", "details": [], "requestId": "..." } }`

错误码常量对齐 API_SPEC.md：`INVALID_PARAMS` / `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `VALIDATION_FAILED` / `CONFLICT_VERSION` / `IDEMPOTENCY_KEY_REUSED` / `RATE_LIMITED` / `INTERNAL_ERROR`

## SCOPE — 认证设计

### 微信登录流程（对齐蓝图 §Authentication And Authorization）

```
小程序                         后端                         微信服务器
  │                             │                             │
  │─ wx.login() ─────────────────────────────────────────────→│
  │← code ◄─────────────────────────────────────────────────│
  │                             │                             │
  │─ POST /api/v1/auth/wechat ─→│                             │
  │   { code }                  │─ code2Session(code) ──────→│
  │                             │← openid, unionid, ────────│
  │                             │   session_key (不返回前端)    │
  │                             │                             │
  │                             │─ 查找/创建 WechatIdentity    │
  │                             │─ 查找/创建 User              │
  │                             │─ 生成 256bit random token   │
  │                             │─ 存储 SHA-256(token) hash   │
  │                             │─ 返回 token + user          │
  │← { token, expiresIn, user }─│                             │
```

### Token 设计

- **类型**：opaque bearer token（256bit crypto.randomBytes）
- **存储**：仅存 `SHA-256(token)` hash + expires_at + user_id + status
- **验证**：Authorization: Bearer xxx → hash(xxx) → 查 Session 表 → 检查 status=active 且未过期 → req.user
- **过期**：expires_in = 7200s（2h），环境变量可配置
- **撤销**：logout → `UPDATE session SET status = 'revoked'`
- **轮换**：新登录 → revoke 旧 session → 创建新 session

### 角色与权限矩阵

| 端点组 | seeker | employer | admin | 未登录 |
|--------|--------|----------|-------|--------|
| `GET /api/v1/home` | ✓ | ✓ | ✓ | ✓ |
| `GET /api/v1/jobs` | ✓ | ✓ | ✓ | ✓ |
| `POST /api/v1/jobs/:id/applications` | ✓ | | | |
| `GET /api/v1/me` | ✓ | ✓ | ✓ | |
| `GET /api/v1/me/resume` | ✓ | | | |
| `PATCH /api/v1/me/resume` | ✓ | | | |
| `POST /api/v1/me/switch-role` | ✓ | ✓ | | |
| `GET /api/v1/employer/organizations/me` | | ✓ | | |
| `POST /api/v1/employer/jobs` | | ✓ | | |
| `GET /api/v1/employer/applications` | | ✓ | | |
| `PATCH /api/v1/employer/applications/:id/status` | | ✓ | | |
| `GET /api/v1/notifications` | ✓ | ✓ | ✓ | |
| `GET /api/v1/privacy/consents/current` | ✓ | ✓ | ✓ | |

> 401 = 未认证或 token 无效；403 = 已认证但角色不允许。

### 安全红线

- `session_key` 永不返回前端、不记录日志、不存储到数据库
- 生产环境强制 TLS
- 微信 appSecret 通过环境变量注入，不入源码
- token hash 使用 SHA-256（token 自身 256bit 随机，无需额外 salt）
- 生产错误响应不暴露堆栈、上游密钥或 session_key

## OUT_OF_SCOPE

**本切片（SPECIFY 阶段）不做：**

- 不写任何后端代码（不创建 .ts/.js 文件、不安装 npm 包）
- 不执行 `prisma migrate`
- 不启动 Express 服务
- 不实现真实微信 code 交换
- 不修改 `miniprogram/` 任何文件
- 不修改 `data/*.js`
- 不修改 `snapshot()` 签名
- 不在 `miniprogram/` 创建 `.ts` 文件（ADR 0002 红线）

**后续切片内容（不在本切片范围）：**

- mock-replacement-v1：前端 API 替换
- wechat-integration-v1：手机号授权
- training-registration-v1：培训报名
- event-registration-v1：活动报名
- file-upload-v1：文件上传
- administration 模块：管理后台 API

## Acceptance

SPECIFY 阶段完成条件：

1. SPEC 覆盖数据库 11 张核心表设计（字段/类型/约束/索引）
2. SPEC 覆盖服务端框架方案（Express + Prisma + TypeScript + Zod + 中间件链）
3. SPEC 覆盖认证设计（微信登录流程 + opaque token + 角色权限矩阵）
4. 5 项关键决策全部确认（D1-D5）
5. `context.mjs validate` 0 error / 0 warning

SPECIFY → PLAN 闸门：人确认 SPEC 后进入 PLAN（拆 TASKS）。

## References

- 接口契约：`API_SPEC.md`（§2 通用规范、§7 用户/登录、§19 实体关系）
- 后端蓝图：`docs/blueprint/backend-design-placeholder.md`
- ADR：`docs/adr/0001-mysql-for-backend.md`
- 已有 schema：`backend/prisma/schema.prisma`
- 当前切片 SPEC：本文件
