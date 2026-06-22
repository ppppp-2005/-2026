# 14-messages SPEC

## Goal

把“消息”Tab 建成招聘消息前端框架，覆盖系统通知、投递反馈和会话详情的本地演示状态。

## Current Slice

- Slice: `messages-service-guard-auth-v1`
- Goal: 消息列表和详情统一通过本地异步服务读取，并补齐诚实的加载、失败、鉴权、分页和草稿校验状态。
- Boundary: 仅做本地交互和内存状态，不连接、保存、订阅或真实发送。

## Required UI

- 保留绿色、米白、大字和卡片式视觉方向。
- 消息首页保留分类、未读、本页已读和详情入口。
- 列表与详情明确展示 loading、empty、error、timeout、offline、unauthorized 和 retry。
- 列表分页加载；下页失败时保留已有消息并提供单独重试。
- 会话草稿必须非空；异步本地校验防重复，始终明确 `sent: false`、不保存、不送达。
- 匿名或过期身份只可进入共享的内存演示登录，不调用真实登录。

## Owned Paths

- `miniprogram/services/messages.js`
- `miniprogram/services/messages.ts`
- `miniprogram/pages/messages/**`
- `miniprogram/pages/message-detail/**`
- `miniprogram/data/messages.js`
- `miniprogram/data/messages.ts`
- `workstreams/14-messages/**`

## Forbidden

- 不修改 `app.json`、共享服务原语或其他业务模块。
- 不实现 WebSocket、轮询、推送、真实发送、存储、上传或后端请求。
- 不声称企业或平台真实发送、接收、已读或送达消息。

## Acceptance

- 页面不直接读取消息 fixture；列表和详情经同一 async messages service。
- 本地状态可操作、可重试，分页失败可见，列表和详情丢弃过期响应。
- 草稿保留在当前页面，空白校验和重复操作均有反馈。
- WXML 事件均有处理器，交互目标至少 88rpx，JS/TS 完全镜像。
- focused verifier 覆盖服务行为、禁用 API 和上述关键契约。
