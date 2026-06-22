# 04-user-profile SPEC

## Goal

把“我的”Tab 从占位页升级为完整的求职者个人中心前端框架，沿用现有绿色、米白、大字和短句视觉语言。

## Required UI

- 我的首页：演示身份、资料完整度、求职意向、简历入口、投递记录入口、身份视图和帮助说明。
- 演示登录页：双协议知情、隐私边界、纯内存会话、登录失效与角色切换，不调用 `wx.login`，不索取手机号。
- 简历编辑页：基本信息、求职意向、技能、工作经历的本地表单、校验与预览状态。
- 投递记录页：全部、待查看、已查看、已沟通等 mock 状态筛选和卡片。
- 所有未接后端动作必须在点击前后明确标注“演示”或“暂未开放”。

## Session Generation Contract

- Every frozen `snapshot()` exposes an immutable, non-negative integer `generation`.
- `generation` increases before each real in-memory session mutation, including login start/completion, expiry, logout/reset, and role changes.
- No-op mutations do not increase `generation`; the counter is never persisted.

## Owned Paths

- `miniprogram/pages/profile/**`
- `miniprogram/pages/profile-login/**`
- `miniprogram/pages/profile-resume/**`
- `miniprogram/pages/profile-applications/**`
- `miniprogram/data/profile.js`
- `miniprogram/data/profile.ts`
- `miniprogram/services/auth-session.js`
- `miniprogram/services/auth-session.ts`
- `workstreams/04-user-profile/**`

## Forbidden

- 不修改 `app.json`、首页、消息、职位、企业或其他模块。
- 不实现真实登录、手机号授权、存储、上传、投递或后端请求。

## Acceptance

- 页面五件套和 JS/TS 数据镜像完整。
- 本地表单、筛选、预览和未开放反馈可验证。
- 本地登录结果始终标注“本地状态演示”，不冒充真实账号或企业权限。
- 会话状态不持久化，支持可验证的登录、失效、退出和求职者/招聘方角色切换。
- 新增路由可由 `01-project-shell` 后续统一注册。
