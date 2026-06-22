# 06-backend-api HANDOFF

## 当前状态

后端板块已预留，但尚未启动实现。当前项目仍使用前端 mock 数据。

## 输入

- 产品蓝图：`docs/blueprint/product-blueprint.md`
- 后端预留说明：`docs/blueprint/backend-design-placeholder.md`
- 前端 API 预留目录：`miniprogram/services`

## 边界

- 不在主控线程中直接写后端。
- 不在当前阶段创建服务器、数据库或接口代码。
- 等用户确认进入后端阶段后，由 `06-backend-api` 子对话负责设计和实现。

## 后续启动时需要考虑

- 微信登录流程和 openid 绑定。
- 求职者/招聘者角色权限。
- 职位、简历、投递、消息的数据模型。
- 前端 mock 数据如何逐步替换成 API。
- 是否需要单独管理后台。

