# 02-home-ui HANDOFF

## P1-2 验证结果

- `node --check miniprogram/pages/home/index.js`：通过。
- `node --check miniprogram/data/home.js`：通过。
- `index.js` / `index.ts` 镜像检查：通过（仅保留 TypeScript 事件参数类型差异）。
- WXML `bindtap` 与 JS 处理器完整性检查：通过。
- 本地 mock 行为检查：四条未开放 toast、职位 Tab 的 `switchTab`、企业页面的 `navigateTo` 均通过。
- 尚未运行微信开发者工具人工点击验收，交由 REVIEW 阶段复查。

## P1-2 整改交接（2026-06-18）

已按 `07-quality-review/HANDOFF.md` 的 P1-2 结论修复首页四处无反馈交互：

- 登录：`onLoginTap`，提示“登录功能暂未开放”。
- 搜索框：`onSearchTap`，提示“搜索功能暂未开放”。
- 最新资讯“更多”：`onNewsMoreTap`，提示“更多资讯暂未开放”。
- 热门服务“全部”：`onServicesAllTap`，提示“全部服务暂未开放”。

修改文件为 `miniprogram/pages/home/index.wxml`、`index.js`、`index.ts` 及本 workstream 的 `TASKS.md`、`HANDOFF.md`。未实现真实登录或搜索，未修改七个功能页、`app.json`、首页数据或其他模块。

验收时应依次点击上述四处，确认每次均出现对应的未开放提示；同时复测八个首页入口原有的 `switchTab`/`navigateTo` 行为不受影响。

## 七页入口集成（2026-06-18）

已完成七个已交付普通页面的首页接入，未修改 `app.json` 或功能页面：

- `hire` -> `/pages/employer/index`
- `training` -> `/pages/training/index`
- `policy` -> `/pages/policy/index`
- `campus` -> `/pages/campus/index`
- `labor` -> `/pages/labor/index`
- `return` -> `/pages/return-home/index`
- `signup` -> `/pages/training-signup/index`

以上入口统一为 `type: "page"`、`enabled: true`、`badge: "可用"`，通过 `wx.navigateTo` 打开。`jobs` 仍为 `type: "tab"`，继续通过 `wx.switchTab` 打开职位 Tab；缺失、禁用或路由为空的入口仍显示“功能建设中”。

本轮修改文件：

- `miniprogram/data/home.js`
- `miniprogram/data/home.ts`
- `miniprogram/pages/home/index.js`
- `miniprogram/pages/home/index.ts`
- `workstreams/02-home-ui/TASKS.md`
- `workstreams/02-home-ui/HANDOFF.md`

验收时在微信开发者工具依次点击 8 个入口：确认“找工作”切换至职位 Tab，其余 7 个入口进入对应普通页面，并确认返回首页后入口区布局稳定。后续接入 API 时，可用服务端入口配置替换 `homeMock.quickEntries`，但需保留 `id/route/type/enabled` 的导航契约，或在首页适配层转换为该结构。

## 当前状态

已完成首页静态 UI，并按确认后的 `ENTRY_UI_PROPOSAL.md` 完成首页 8 个入口区域改版。当前入口区为“2 列大字图章式入口”，仅 `找工作` 入口可跳转职位 Tab，其他入口保留显示并提示“功能建设中”。

## 本次修改文件

- `miniprogram/data/home.ts`
  - 扩展首页入口 mock 数据字段：`id/name/description/iconText/color/bgColor/route/type/enabled/badge`。
  - 将 `找工作` 配置为 `type: "tab"`、`route: "/pages/jobs/index"`、`enabled: true`、`badge: "常用"`。
  - 其他 7 个入口配置为 `type: "disabled"`、`enabled: false`、`badge: "建设中"`。
- `miniprogram/data/home.js`
  - 与 `home.ts` 同步，保证未启用 TypeScript 编译时微信开发者工具也能运行。
- `miniprogram/pages/home/index.ts`
  - 引入 `homeMock` 并挂载到页面 data。
  - 增加 `onEntryTap`：可用 Tab 入口调用 `wx.switchTab`，未开通入口调用 `wx.showToast`。
- `miniprogram/pages/home/index.js`
  - 与 `index.ts` 同步入口点击逻辑，避免未启用 TypeScript 编译时找不到页面脚本。
- `miniprogram/pages/home/index.wxml`
  - 将入口区标题改为 `常用服务`。
  - 将 8 个入口从 4 列小图标改为 2 列大卡片。
  - 每个入口展示图章字、标题、短说明、可选 badge 和右侧 `>`。
  - 静态中文标题通过 `home.ui` 数据绑定渲染，减少模板编码问题。
- `miniprogram/pages/home/index.wxss`
  - 补充入口卡片布局约束，保持 2 列卡片在手机宽度下稳定排布。
- `workstreams/02-home-ui/TASKS.md`
  - 更新任务完成状态和静态检查记录。
- `workstreams/02-home-ui/HANDOFF.md`
  - 更新本交接说明。

## 已确认设计方案

方案文件：`workstreams/02-home-ui/ENTRY_UI_PROPOSAL.md`

核心建议：

- 将当前 4 列小宫格改为“2 列大字图章式入口”。
- 每个入口展示大号图章字、入口名称、一句短说明和可选状态标签。
- 面向文化程度较低或手机使用不熟练的工人，优先保证“看得清、点得准、意思直白”。
- 为后续 API 和点击跳转预留 `id/name/description/iconText/color/bgColor/route/type/enabled/badge` 字段。

本次没有创建单独页面，没有接真实 API，没有修改职位页、消息页、我的页、后端或项目骨架。

## 本次入口改版实现

已按方案落地：

- 入口区标题：`常用服务`。
- 布局：一行 2 个大卡片，共 4 行。
- 单个入口：图章字、标题、短说明、badge、右侧 `>`。
- 点击行为：
  - `找工作`：`wx.switchTab({ url: "/pages/jobs/index" })`。
  - 其他入口：`wx.showToast({ title: "功能建设中", icon: "none" })`。
- 数据同步：`home.ts` 与 `home.js`、`index.ts` 与 `index.js` 均已同步。
- 未新增页面，未接真实 API。

## 后续 API 替换点

后续接 API 时可优先替换 `miniprogram/data/home.ts` 与 `miniprogram/data/home.js` 中这些字段：

- `quickEntries`：功能入口名称、图章字、颜色、跳转路径、入口类型、权限或维护状态。
- `ui`：首页分区标题、更多、全部等静态展示文案。
- `news`：资讯列表、发布时间、详情页路径。
- `services`：热门服务标题、描述、标签和跳转路径。
- `brand`：地区名称、首页标题、副标题、登录状态文案。

`quickEntries` 当前字段含义：

- `id`：稳定业务标识。
- `name`：入口名称。
- `description`：短说明。
- `iconText`：文字图章。
- `color`：主色。
- `bgColor`：浅背景色。
- `route`：跳转地址。
- `type`：跳转类型，例如 `tab`、`page`、`webview`、`action`、`disabled`。
- `enabled`：是否可点击执行真实跳转或动作。
- `badge`：可选状态标签。

## 验收说明

- 已执行 `node --check miniprogram/data/home.js`，JS 语法检查通过。
- 已执行 `node --check miniprogram/pages/home/index.js`，JS 语法检查通过。
- 建议主控线程或用户在微信开发者工具模拟器中检查：
  - 首页入口区是否显示为一行 2 个大卡片。
  - `找工作` 是否切到职位 Tab。
  - 其他 7 个入口是否提示“功能建设中”。
  - 手机宽度下是否无横向滚动、文字无明显溢出。
