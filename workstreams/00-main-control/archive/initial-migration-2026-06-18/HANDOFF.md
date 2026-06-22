# 00-main-control HANDOFF

## 当前状态

本批次七个普通页面、首页入口与路由集成已完成，独立静态 REVIEW 通过，等待微信开发者工具人工 VERIFY。

## 当前线程

- `00-main-control`：当前对话。
- `01-project-shell`：`019ed762-0a59-79b3-92f3-3096ae0b71b4`
- `02-home-ui`：`019ed762-3fb0-7f51-8c02-87adc6010beb`
- `02-home-ui-entry-implementation`：`019ed7b8-bc7f-7fb1-83ce-f8ce290f7c3f`
- `03-jobs`：`019ed795-a34f-7513-bc1e-e38e79391147`
- `05-employer`：`019ed96c-f865-7ea1-8f4c-97b9166bd18d`
- `08-skill-training`：`019ed96c-ee4e-71b1-9df8-87575cd78956`
- `09-policy`：`019ed96c-ff49-7ae0-8dd4-d77b67bbdb13`
- `10-campus`：`019ed96d-18bd-7600-b8ec-0f43628eb567`
- `11-labor-info`：`019ed96d-0b84-7c82-a8cf-6582bd281c38`
- `12-return-home`：`019ed96d-0545-7aa1-97d9-a60ff297d773`
- `13-training-signup`：`019ed96d-1300-7c43-9f07-9c78a382bba9`
- `07-quality-review`：`019ed97b-e688-7222-b183-6343d9bc58db`

## 给其他线程的边界

- 正式代码统一写入 `miniprogram`。
- 不要在 workstream 目录里创建独立小程序项目。
- 当前阶段不接真实后端。
- 当前阶段不实现登录、投递、聊天、发布职位。
- 主控线程不得直接实现功能模块；任何实质页面、数据、业务逻辑都必须由对应 workstream 子对话完成。
- 若主控线程误做模块实现，必须补建对应子对话并交由该子对话接管。

## 等待事项

- 已检查 `01-project-shell`：基础工程骨架、四个 Tab 页面、全局样式和交接文档已完成。
- 已检查 `02-home-ui`：首页静态 UI、首页 mock 数据和交接文档已完成。
- 已通过微信开发者工具模拟器看到首页、底部 Tab 和静态内容。
- 已修正首页登录入口样式，避免像输入框。
- 已启动并完成 `03-jobs` 静态职位页第一版，但这是主控线程直接实现的例外。
- 已补建 `03-jobs` 子对话接管后续验收和迭代：`019ed795-a34f-7513-bc1e-e38e79391147`。
- 已预留 `06-backend-api` 后端设计板块，当前不实现后端代码、不创建数据库、不替换前端 mock 数据。
- 已委托 `02-home-ui` 子对话产出首页 8 个入口 UI 改版方案，文件为 `workstreams/02-home-ui/ENTRY_UI_PROPOSAL.md`。当前尚未落代码，等待用户确认。
- 用户已确认入口 UI 标准后，已委托 `02-home-ui-entry-implementation` 子对话落地首页入口区改版。
- 首页入口区已从 4 列小图标改为 2 列大字图章式入口；`找工作` 跳转职位 Tab，其余 7 个入口使用 `navigateTo` 打开普通页面。
- 用户已要求把其余 7 个入口实现为可跳转页面。总控已拆分 `05-employer`、`08-skill-training`、`09-policy`、`10-campus`、`11-labor-info`、`12-return-home`、`13-training-signup` 七个 workstream。
- 七个功能线程只拥有各自页面、数据与文档；`app.json` 统一交由 `01-project-shell` 注册，首页入口统一交由 `02-home-ui-entry-implementation` 更新，避免并行覆盖。
- 七个页面已完成，`01-project-shell` 已注册路由，`02-home-ui-entry-implementation` 已启用全部入口。
- 首轮 `07-quality-review` 发现 4 个 P1：虚假报名成功提示、首页静态控件无反馈、技能培训按钮承诺不符、校园招按钮反馈不符。对应 owner 均已整改。
- `07-quality-review` 复验已通过：P1 清零，24 个事件绑定、8 组数据镜像、8 个首页入口、Tab 配置和全部 JSON 无回归。
- 当前仅剩微信开发者工具人工验收：编译、8 个入口跳转、返回栈、toast、320px 窄屏和大字体可读性。
