# 07-quality-review TASKS

## 本批次独立复查

- [x] 阅读项目规则、Agent Skills 流程、Workflow 和本 workstream 文档。
- [x] 阅读 `01-project-shell`、`02-home-ui` 以及 `05`、`08` 至 `13` 七个功能 workstream 的 HANDOFF。
- [x] 核对 `app.json` 注册路由、Tab 配置与七个普通页面五件套。
- [x] 检查相关 JS/TS 语法、全部项目 JSON、WXML 绑定和事件处理器。
- [x] 深度比较首页与七页 mock 数据 JS/TS 镜像，并比较页面 JS/TS 方法与微信 API 调用面。
- [x] 检查首页八入口契约、mock 计数、后端/持久化调用和误导性文案。
- [x] 记录首轮 P1 并退回 `02-home-ui`、`08-skill-training`、`10-campus`、`13-training-signup`。
- [x] 重新读取四个 owner 最新 HANDOFF 与实际代码，复验 P1-1 至 P1-4。
- [x] 确认旧 P1 文案清零、24 个 WXML 事件处理器在 JS/TS 中存在、镜像与语法通过。
- [x] 确认首页八入口、七条普通页路由和四个 Tab 未回归。
- [ ] 在微信开发者工具完成编译、导航、交互、窄屏和视觉人工验收。

## 当前结论

- **静态复查通过**：P1 已清零，无 P0/P1 阻断。
- 仍需完成微信开发者工具人工 VERIFY，才可进入最终 SHIP/验收状态。
- 功能代码未由本线程修改；本轮仅更新 `workstreams/07-quality-review/**` 文档。
