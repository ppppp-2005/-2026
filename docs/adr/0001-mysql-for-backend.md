# 0001: MySQL 作为后端数据库

**Status**: Accepted

后端使用 MySQL 8 作为数据库，通过 Prisma ORM 连接。数据库连接字符串受 `mysql://` 前缀强制校验。

## Context

后端架构设计阶段需选定数据库。常见选择包括 MySQL、PostgreSQL 和 SQLite。

## Decision

选择 MySQL。此决策已编码到项目文件中，无法不经修改代码就切换数据库。

## Evidence

| 来源 | 内容 |
|------|------|
| `backend/prisma/schema.prisma` 第 2 行 | 注释：`Datasource: MySQL 8 (matches docker-compose.yml)` |
| `backend/prisma/schema.prisma` 第 10-13 行 | `datasource db { provider = "mysql" url = env("DATABASE_URL") }` |
| `backend/docker-compose.yml` 第 3 行 | `image: mysql:8.0` |
| `backend/src/config/index.ts` 第 49-52 行 | 强制校验 `DATABASE_URL` 必须以 `mysql://` 开头，否则启动报错退出 |
| `backend/.env.example` 第 16-17 行 | `DATABASE_URL=mysql://user:pass@localhost:3307/sandu_job` |
| `backend/package.json` 第 26-27 行 | 依赖 `@prisma/client` 和 `prisma` |

## Consequences

- 开发和部署环境都需要 MySQL 8 实例
- Prisma schema 中 8 张表使用 MySQL 特有的 `@db.Char(36)`、`@db.VarChar`、`@db.LongText` 等类型注解
- 切换数据库需同时改 schema、config 校验和类型注解

## Alternatives considered

- **SQLite**：零配置，适合本地开发，但 Prisma schema 中已有 MySQL 特定类型注解（`@db.Char`、`@db.LongText`），切换需大量重写
- **PostgreSQL**：功能更强，但 MySQL 类型注解同样不兼容
