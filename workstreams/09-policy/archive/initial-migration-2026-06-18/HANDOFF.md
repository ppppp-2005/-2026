# 09-policy HANDOFF

## 状态

BUILD 与 VERIFY 已完成，等待 `00-main-control` REVIEW，并由项目骨架线程完成路由集成。

## 已完成

- 新增“看政策”原生小程序页面，沿用绿色、米白、低圆角、大字和短句的现有视觉语言。
- 提供 6 条贵州本地就业政策演示数据，覆盖找工作、技能培训、外出务工和创业。
- 每条政策先展示适用人群、支持要点和咨询地点，展开后显示材料与办理步骤。
- 分类切换会在前端即时筛选并 toast 提示结果数量。
- 重点提醒、详情展开/收起提供 toast，咨询按钮提供本地弹窗反馈。
- 页面明确标注为演示数据，实际条件和标准需以当地人社部门最新通知为准。

## 文件清单

- `miniprogram/pages/policy/index.wxml`
- `miniprogram/pages/policy/index.wxss`
- `miniprogram/pages/policy/index.json`
- `miniprogram/pages/policy/index.js`
- `miniprogram/pages/policy/index.ts`
- `miniprogram/data/policy.js`
- `miniprogram/data/policy.ts`
- `workstreams/09-policy/TASKS.md`
- `workstreams/09-policy/HANDOFF.md`

## 验证结果

- `node --check miniprogram/pages/policy/index.js`：通过。
- `node --check miniprogram/data/policy.js`：通过。
- 页面 JSON 解析：通过。
- mock 数据检查：6 条政策、5 个分类，分类引用、材料和步骤字段完整。
- JS/TS mock 数据一致性检查：通过。
- WXML 事件绑定检查：4 个处理函数均存在。
- 功能模拟：分类筛选、详情展开/收起、toast 和咨询弹窗均通过。
- WXML 标签嵌套检查：通过。
- 未使用图片、emoji、手绘 SVG 或图标占位资源。

未执行微信开发者工具视觉预览，因为本 workstream 按边界不能修改 `app.json` 注册路由；集成后需在开发者工具中补做页面视觉和点击回归。

## 代码边界

- 可修改：`miniprogram/pages/policy/**`、`miniprogram/data/policy.js`、`miniprogram/data/policy.ts`、本 workstream 文档。
- 禁止修改：首页、`app.json`、其他页面、后端文件。

## 集成需求

- 项目骨架线程在 `app.json` 注册 `pages/policy/index`。
- 首页线程将“看政策”入口跳转地址设置为 `/pages/policy/index`。
- 集成后在微信开发者工具中检查分类横向滚动、详情展开高度和低宽度设备的文字换行。
